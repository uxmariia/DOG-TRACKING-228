import { useState, useEffect } from 'react';
import TrackMap from './TrackMap';
import { Dog, TrailPoint, ObjectMarker } from '../App';
import {
  ArrowLeft,
  Play,
  Pause,
  MapPin,
  Package,
  CheckCircle,
  Cloud,
  Wind,
  Thermometer,
  Copy,
  Satellite,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';
import { geoService, GeoPosition, GeoError } from '../utils/geolocation';

interface CreateTrailProps {
  dog: Dog | null;
  dogs?: Dog[];
  onFinish: (trail: TrailPoint[], objects: ObjectMarker[], conditions: any) => void;
  onBack: () => void;
  onStartLiveSession: (dogId: string) => Promise<string | null>;
  liveSessionId: string | null;
}

export function CreateTrail({
  dog,
  dogs = [],
  onFinish,
  onBack,
  onStartLiveSession,
  liveSessionId,
}: CreateTrailProps) {
  const [activeDog, setActiveDog] = useState<Dog | null>(
    dog || (dogs.length > 0 ? dogs[0] : null),
  );
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const [objects, setObjects] = useState<ObjectMarker[]>([]);
  const [showConditionsForm, setShowConditionsForm] = useState(false);
  const [conditions, setConditions] = useState({
    weather: 'sunny',
    temperature: '',
    wind: 'calm',
    surface: 'grass',
    notes: '',
  });
  const [localLiveSessionId, setLocalLiveSessionId] = useState<string | null>(null);
  const [copiedSessionCode, setCopiedSessionCode] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'waiting' | 'active' | 'error'>('waiting');
  const [gpsError, setGpsError] = useState<string>('');
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0);
  const [lastPosition, setLastPosition] = useState<GeoPosition | null>(null);
  const [showGpsPermissionDialog, setShowGpsPermissionDialog] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  // ======== Resume незавершеної сесії ========
  useEffect(() => {
    const saved = localStorage.getItem('current_trail_session');
    if (saved && !isTracking && trailPoints.length === 0) {
      try {
        const data = JSON.parse(saved);
        // валідно 24 години
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          if (confirm('Знайдено незавершений запис сліду. Відновити?')) {
            setTrailPoints(data.trailPoints || []);
            setObjects(data.objects || []);
            if (data.activeDogId && dogs) {
              const d = dogs.find((x) => x.id === data.activeDogId);
              if (d) setActiveDog(d);
            }
          } else {
            localStorage.removeItem('current_trail_session');
          }
        }
      } catch (e) {
        console.error('Error parsing saved session', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogs]);

  // ======== Auto-save в localStorage ========
  useEffect(() => {
    if (trailPoints.length > 0) {
      localStorage.setItem(
        'current_trail_session',
        JSON.stringify({
          trailPoints,
          objects,
          activeDogId: activeDog?.id,
          timestamp: Date.now(),
        }),
      );
    }
  }, [trailPoints, objects, activeDog]);

  // ======== Live-сесія оновлення ========
  const updateLiveSession = async (points: TrailPoint[], objs: ObjectMarker[]) => {
    const sessionId = liveSessionId || localLiveSessionId;
    if (!sessionId) return;

    try {
      // формат узгоджений з DogTracking
      await apiClient.updateLiveSession(sessionId, {
        type: 'trail',
        trail: points,
        objects: objs,
      });
    } catch (error) {
      console.error('Error updating live session:', error);
    }
  };

  // ======== GPS-трекінг ========
  useEffect(() => {
    if (!isTracking || isPaused) {
      geoService.stopWatching();
      return;
    }

    setGpsStatus('waiting');
    setGpsError('');

    geoService.startWatching(
      (position: GeoPosition) => {
        setGpsStatus('active');
        setCurrentAccuracy(position.accuracy || 0);
        setLastPosition(position);

        const newPoint: TrailPoint = {
          lat: position.lat,
          lng: position.lng,
          timestamp: position.timestamp,
        };

        setTrailPoints((prev) => {
          const updated = [...prev, newPoint];

          if (liveSessionId || localLiveSessionId) {
            updateLiveSession(updated, objects);
          }

          return updated;
        });
      },
      (error: GeoError) => {
        setGpsStatus('error');
        setGpsError(error.message);
        console.error('GPS error:', error);
      },
    );

    return () => {
      geoService.stopWatching();
    };
  }, [isTracking, isPaused, liveSessionId, localLiveSessionId, objects]);

  // ======== Старт запису ========
  const handleStart = () => {
    if (!navigator.geolocation) {
      alert('Геолокація недоступна в цьому браузері');
      return;
    }

    setShowGpsPermissionDialog(true);
  };

  // ======== Запит дозволу на GPS ========
  const handleRequestGpsPermission = async () => {
    setRequestingPermission(true);
    setGpsError('');

    try {
      const position = await geoService.getCurrentPosition();
      setGpsStatus('active');
      setCurrentAccuracy(position.accuracy || 0);
      setShowGpsPermissionDialog(false);

      setIsTracking(true);
      setIsPaused(false);

      // старт live-сесії для активної собаки
      const dogForLive = activeDog || dog;
      if (dogForLive && !liveSessionId && !localLiveSessionId) {
        const sessionId = await onStartLiveSession(dogForLive.id);
        if (sessionId) {
          setLocalLiveSessionId(sessionId);
        }
      }
    } catch (error: any) {
      setGpsStatus('error');
      setGpsError(error.message || 'Помилка доступу до геолокації');
    } finally {
      setRequestingPermission(false);
    }
  };

  const handlePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleAddObject = () => {
    if (trailPoints.length === 0) {
      alert('Спочатку почніть запис сліду');
      return;
    }

    const lastPoint = lastPosition
      ? { lat: lastPosition.lat, lng: lastPosition.lng }
      : trailPoints[trailPoints.length - 1];

    const newObject: ObjectMarker = {
      id: Date.now().toString(),
      lat: lastPoint.lat,
      lng: lastPoint.lng,
      type: 'placed',
      timestamp: Date.now(),
    };

    setObjects((prev) => {
      const updated = [...prev, newObject];

      if (liveSessionId || localLiveSessionId) {
        updateLiveSession(trailPoints, updated);
      }

      return updated;
    });
  };

  const handleFinish = () => {
    if (trailPoints.length === 0) {
      alert('Спочатку запишіть слід');
      return;
    }
    localStorage.removeItem('current_trail_session');
    setShowConditionsForm(true);
  };

  const handleSubmitConditions = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(false);
    onFinish(trailPoints, objects, conditions);
  };

  // ======== Статистика: відстань / час / кроки ========
  const distance =
    trailPoints.length > 1
      ? trailPoints.reduce((sum, point, i) => {
          if (i === 0) return 0;
          const prev = trailPoints[i - 1];
          const R = 6371000;
          const dLat = ((point.lat - prev.lat) * Math.PI) / 180;
          const dLng = ((point.lng - prev.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((prev.lat * Math.PI) / 180) *
              Math.cos((point.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return sum + R * c;
        }, 0)
      : 0;

  const duration =
    trailPoints.length > 0
      ? Math.floor((Date.now() - trailPoints[0].timestamp) / 1000)
      : 0;

  const steps = Math.round(distance * 1.3); // 1 м ≈ 1.3 кроки

  const handleCopySessionCode = async () => {
    const sessionId = liveSessionId || localLiveSessionId;
    if (!sessionId) return;

    await copyToClipboard(sessionId);
    setCopiedSessionCode(true);
    setTimeout(() => setCopiedSessionCode(false), 2000);
  };

  // ======== Умови тренування (форма) ========
  if (showConditionsForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-center">Умови тренування</h1>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmitConditions} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Cloud size={16} />
                  Погода
                </label>
                <select
                  value={conditions.weather}
                  onChange={(e) =>
                    setConditions({ ...conditions, weather: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sunny">☀️ Сонячно</option>
                  <option value="cloudy">☁️ Хмарно</option>
                  <option value="rainy">🌧️ Дощ</option>
                  <option value="snowy">❄️ Сніг</option>
                  <option value="foggy">🌫️ Туман</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Thermometer size={16} />
                  Температура (°C)
                </label>
                <input
                  type="number"
                  value={conditions.temperature}
                  onChange={(e) =>
                    setConditions({ ...conditions, temperature: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Наприклад: 15"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Wind size={16} />
                  Вітер
                </label>
                <select
                  value={conditions.wind}
                  onChange={(e) =>
                    setConditions({ ...conditions, wind: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="calm">Спокійно</option>
                  <option value="light">Легкий</option>
                  <option value="moderate">Помірний</option>
                  <option value="strong">Сильний</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Тип покриття
                </label>
                <select
                  value={conditions.surface}
                  onChange={(e) =>
                    setConditions({ ...conditions, surface: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grass">🌱 Трава</option>
                  <option value="forest">🌲 Ліс</option>
                  <option value="asphalt">🛣️ Асфальт</option>
                  <option value="sand">🏖️ Пісок</option>
                  <option value="snow">❄️ Сніг</option>
                  <option value="mixed">🔀 Змішане</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Примітки</label>
                <textarea
                  value={conditions.notes}
                  onChange={(e) =>
                    setConditions({ ...conditions, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Додаткова інформація про умови..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConditionsForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Продовжити
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ======== Основний екран створення сліду ========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1>Створення сліду</h1>
        </div>
        {dogs && dogs.length > 1 ? (
          <select
            value={activeDog?.id || ''}
            onChange={(e) => {
              const d = dogs.find((x) => x.id === e.target.value);
              setActiveDog(d || null);
            }}
            disabled={isTracking && trailPoints.length > 0}
            className="w-full bg-blue-700 text-white border border-blue-500 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Оберіть собаку (необов'язково)</option>
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        ) : (
          activeDog && (
            <div className="text-sm text-blue-100 text-center">
              Собака: {activeDog.name}
            </div>
          )
        )}
      </div>

      {/* Map Area */}
      <div className="relative h-80 m-4 rounded-xl shadow-md overflow-hidden bg-gray-200">
        {/* Реальна карта */}
        <TrackMap trailPoints={trailPoints} objects={objects} lastPosition={lastPosition} />

        {/* GPS Status Indicator */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`px-3 py-2 rounded-lg text-xs shadow-lg flex items-center gap-2 ${
              gpsStatus === 'active'
                ? 'bg-green-500 text-white'
                : gpsStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-yellow-500 text-white'
            }`}
          >
            {gpsStatus === 'active' ? (
              <>
                <Satellite size={14} className="animate-pulse" />
                <span>GPS: {currentAccuracy.toFixed(0)}м</span>
              </>
            ) : gpsStatus === 'error' ? (
              <>
                <AlertCircle size={14} />
                <span>GPS помилка</span>
              </>
            ) : (
              <>
                <Satellite size={14} className="animate-spin" />
                <span>Пошук GPS...</span>
              </>
            )}
          </div>
        </div>

        {/* Live Session Indicator */}
        {(liveSessionId || localLiveSessionId) && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <button
                onClick={handleCopySessionCode}
                className="flex items-center gap-1 hover:underline"
              >
                {copiedSessionCode ? <CheckCircle size={12} /> : <Copy size={12} />}
                <span>
                  {copiedSessionCode ? 'Скопійовано!' : liveSessionId || localLiveSessionId}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Status overlay */}
        {isTracking && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Відстань:</span>
                <span className="text-gray-800">{Math.round(distance)} м</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Час:</span>
                <span className="text-gray-800">
                  {Math.floor(duration / 60)}:
                  {(duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* GPS Error */}
        {gpsError && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
              {gpsError}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-blue-600 mb-1">{Math.round(distance)}</div>
            <div className="text-xs text-gray-600">метрів</div>
            <div className="text-[10px] text-gray-400 mt-1">~{steps} кроків</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-green-600 mb-1">{trailPoints.length}</div>
            <div className="text-xs text-gray-600">точок</div>
          </div>
          <div className="text-center">
            <div className="text-orange-600 mb-1">{objects.length}</div>
            <div className="text-xs text-gray-600">предметів</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 space-y-3">
        {!isTracking ? (
          <button
            onClick={handleStart}
            className="w-full bg-green-600 text-white p-5 rounded-xl shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-3"
          >
            <Play size={24} />
            <span>Почати запис сліду</span>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePause}
                className={`p-5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  isPaused
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                <span>{isPaused ? 'Продовжити' : 'Пауза'}</span>
              </button>

              <button
                onClick={handleAddObject}
                className="bg-orange-600 text-white p-5 rounded-xl shadow-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Package size={20} />
                <span>Додати предмет</span>
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-blue-600 text-white p-5 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
            >
              <CheckCircle size={24} />
              <span>Завершити слід</span>
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!isTracking && (
        <div className="px-4 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-blue-900 mb-2">Інструкції:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Натисніть "Почати запис сліду"</li>
              <li>Йдіть маршрутом, додаток буде записувати ваш рух</li>
              <li>Додавайте мітки предметів в потрібних місцях</li>
              <li>Завершіть запис та вкажіть умови тренування</li>
            </ol>
          </div>
        </div>
      )}

     {/* GPS Permission Dialog */}
{showGpsPermissionDialog && (
  <div className="modal-overlay bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <div className="text-center mb-6">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Satellite className="text-blue-600" size={32} />
        </div>

        <h3 className="text-gray-800 mb-2">Доступ до геолокації</h3>
        <p className="text-sm text-gray-600">
          Для запису треку додатку потрібен доступ до вашого місцеположення
        </p>
      </div>

      {gpsError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium mb-1">Помилка доступу</div>
              <div>{gpsError}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-blue-900 mb-2 text-sm">Що потрібно зробити:</h4>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Натисніть &quot;Надати доступ&quot; нижче</li>
          <li>У вікні браузера виберіть &quot;Дозволити&quot;</li>
          <li>Зачекайте поки GPS визначить ваше місце</li>
          <li>Починайте рух по маршруту</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2 text-xs text-yellow-800">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            Для найкращої точності рекомендуємо:
            <ul className="mt-1 space-y-0.5 list-disc list-inside ml-2">
              <li>Знаходитись на відкритій місцевості</li>
              <li>Увімкнути GPS на пристрої</li>
              <li>Зачекати стабільного сигналу</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowGpsPermissionDialog(false);
            setGpsError('');
          }}
          disabled={requestingPermission}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Скасувати
        </button>

        <button
          onClick={handleRequestGpsPermission}
          disabled={requestingPermission}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {requestingPermission ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Запит...</span>
            </>
          ) : (
            <>
              <Satellite size={20} />
              <span>Надати доступ</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default CreateTrail;
