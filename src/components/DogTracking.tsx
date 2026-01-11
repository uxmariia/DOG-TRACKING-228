import React, { useState, useEffect } from 'react';
import { Dog, TrailPoint, ObjectMarker } from '../App';
import {
  ArrowLeft,
  Satellite,
  AlertCircle,
  Play,
  Pause,
  CheckCircle,
  MapPin,
  Package,
} from 'lucide-react';
import { geoService, GeoPosition, GeoError } from '../utils/geolocation';

interface DogTrackingProps {
  dog: Dog | null;
  placedObjects: ObjectMarker[];            // Об’єкти, які були розкладені на сліду
  onBack: () => void;
  liveSessionId: string | null;            // Можемо показувати статус, але не обов’язково використовувати
  onFinish?: (dogTrack: TrailPoint[], foundObjects: ObjectMarker[]) => void;
}

const DogTracking: React.FC<DogTrackingProps> = ({
  dog,
  placedObjects,
  onBack,
  liveSessionId,
  onFinish,
}) => {
  const [dogPoints, setDogPoints] = useState<TrailPoint[]>([]);
  const [foundObjects, setFoundObjects] = useState<ObjectMarker[]>([]);

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [gpsStatus, setGpsStatus] = useState<'waiting' | 'active' | 'error'>('waiting');
  const [gpsError, setGpsError] = useState('');
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [lastPosition, setLastPosition] = useState<GeoPosition | null>(null);

  const [lastObjectId, setLastObjectId] = useState<string | null>(null);

  // ====== GPS трекінг собаки ======
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
        setCurrentAccuracy(position.accuracy ?? null);
        setLastPosition(position);

        const newPoint: TrailPoint = {
          lat: position.lat,
          lng: position.lng,
          timestamp: position.timestamp,
        };

        setDogPoints((prev) => [...prev, newPoint]);

        // Перевірка предметів поблизу
        placedObjects.forEach((obj) => {
          const alreadyFound = foundObjects.some((f) => f.id === obj.id);
          if (alreadyFound) return;

          const distanceMeters = Math.sqrt(
            Math.pow((obj.lat - position.lat) * 111_000, 2) +
              Math.pow((obj.lng - position.lng) * 111_000, 2)
          );

          // Триггер, якщо собака підійшла достатньо близько (радіус 7 м)
          if (distanceMeters < 7) {
            setFoundObjects((prev) => [...prev, obj]);
            setLastObjectId(obj.id);
          }
        });
      },
      (error: GeoError) => {
        setGpsStatus('error');
        setGpsError(error.message);
      }
    );

    return () => {
      geoService.stopWatching();
    };
  }, [isTracking, isPaused, placedObjects, foundObjects]);

  // Примітивна оцінка довжини шляху
  const distanceMeters =
    dogPoints.length > 1
      ? dogPoints.reduce((sum, point, i) => {
          if (i === 0) return 0;
          const prev = dogPoints[i - 1];
          const dx = point.lat - prev.lat;
          const dy = point.lng - prev.lng;
          return sum + Math.sqrt(dx * dx + dy * dy) * 111_000;
        }, 0)
      : 0;

  const handleStart = () => {
    setIsTracking(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    if (!isTracking) return;
    setIsPaused((prev) => !prev);
  };

  const handleFinish = () => {
    setIsTracking(false);
    setIsPaused(false);
    geoService.stopWatching();

    if (onFinish) {
      onFinish(dogPoints, foundObjects);
    }

    onBack();
  };

  // ====== РЕНДЕР ======
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Трекінг собаки</span>
          <span className="font-semibold">
            {dog ? dog.name : 'Без вибраної собаки'}
          </span>
        </div>
        {liveSessionId && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
            Live session
          </span>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* GPS status */}
        <section className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Satellite size={20} />
              <span className="font-medium">GPS статус</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                gpsStatus === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                  : gpsStatus === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/40'
                  : 'bg-slate-700/60 text-slate-200 border border-slate-600'
              }`}
            >
              {gpsStatus === 'active'
                ? 'Активний'
                : gpsStatus === 'error'
                ? 'Помилка'
                : 'Очікування'}
            </span>
          </div>

          {currentAccuracy != null && gpsStatus === 'active' && (
            <p className="text-xs text-slate-300">
              Поточна точність: ~{Math.round(currentAccuracy)} м
            </p>
          )}

          {gpsError && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
              <AlertCircle size={14} />
              <span>{gpsError}</span>
            </p>
          )}

          {lastPosition && (
            <p className="mt-2 text-xs text-slate-400">
              Остання позиція: {lastPosition.lat.toFixed(6)},{' '}
              {lastPosition.lng.toFixed(6)}
            </p>
          )}
        </section>

        {/* Track info */}
        <section className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={18} />
            <span className="font-medium">Шлях собаки</span>
          </div>
          <p className="text-xs text-slate-300">
            Точок у треку: {dogPoints.length}
          </p>
          <p className="text-xs text-slate-300">
            Орієнтовна довжина: {distanceMeters.toFixed(0)} м
          </p>
        </section>

        {/* Objects */}
        <section className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
          <div className="flex items-center gap-2">
            <Package size={18} />
            <span className="font-medium">Об&apos;єкти на сліду</span>
          </div>

          <p className="text-xs text-slate-300">
            Розкладено об&apos;єктів: {placedObjects.length}
          </p>
          <p className="text-xs text-slate-300">
            Знайдено: {foundObjects.length}
          </p>

          {lastObjectId && (
            <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle size={14} />
              Останній знайдений об&apos;єкт ID: {lastObjectId}
            </p>
          )}
        </section>
      </main>

      {/* Bottom controls */}
      <footer className="px-4 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-3">
        <button
          onClick={handleStart}
          disabled={isTracking && !isPaused}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isTracking && !isPaused
              ? 'bg-slate-800 text-slate-300 cursor-not-allowed'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          }`}
        >
          <Play size={18} />
          Старт
        </button>

        <button
          onClick={handlePauseResume}
          disabled={!isTracking}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            !isTracking
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
          }`}
        >
          <Pause size={18} />
          {isPaused ? 'Продовжити' : 'Пауза'}
        </button>

        <button
          onClick={handleFinish}
          disabled={dogPoints.length === 0}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            dogPoints.length === 0
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
          }`}
        >
          <CheckCircle size={18} />
          Фініш
        </button>
      </footer>
    </div>
  );
};

export default DogTracking;

