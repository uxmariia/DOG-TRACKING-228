import { useState, useEffect } from 'react';
import { TrailPoint, ObjectMarker, Dog } from '../App';
import { ArrowLeft, Play, Pause, CheckCircle, MapPin, Copy, Satellite, AlertCircle } from 'lucide-react';
import { apiClient } from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';
import { geoService, GeoPosition, GeoError } from '../utils/geolocation';
import { ClientMapView } from './ClientMapView';
import { GPSIndicator } from './GPSIndicator';

interface DogTrackingProps {
  dog: Dog | null;
  trail: TrailPoint[];
  placedObjects: ObjectMarker[];
  onFinish: (dogPoints: TrailPoint[], foundObjects: ObjectMarker[]) => void;
  onBack: () => void;
  onStartLiveSession: (dogId: string) => Promise<string | null>;
  liveSessionId: string | null;
}

export function DogTracking({ dog, trail, placedObjects, onFinish, onBack, onStartLiveSession, liveSessionId }: DogTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dogPoints, setDogPoints] = useState<TrailPoint[]>([]);
  const [foundObjects, setFoundObjects] = useState<ObjectMarker[]>([]);
  const [showObjectPrompt, setShowObjectPrompt] = useState(false);
  const [localLiveSessionId, setLocalLiveSessionId] = useState<string | null>(null);
  const [copiedSessionCode, setCopiedSessionCode] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'waiting' | 'active' | 'error'>('waiting');
  const [gpsError, setGpsError] = useState<string>('');
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0);
  const [lastPosition, setLastPosition] = useState<any>(null);
  const [showGpsPermissionDialog, setShowGpsPermissionDialog] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  
  // Local state for trail/objects to support resume functionality
  const [activeTrail, setActiveTrail] = useState<TrailPoint[]>(trail);
  const [activePlacedObjects, setActivePlacedObjects] = useState<ObjectMarker[]>(placedObjects);

  // Resume functionality
  useEffect(() => {
    const saved = localStorage.getItem('current_tracking_session');
    if (saved && !isTracking && dogPoints.length === 0) {
      try {
        const data = JSON.parse(saved);
        // Valid for 24 hours
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          if (confirm('Знайдено незавершене тренування. Відновити?')) {
            setDogPoints(data.dogPoints || []);
            setFoundObjects(data.foundObjects || []);
            if (data.trail && data.trail.length > 0) setActiveTrail(data.trail);
            if (data.placedObjects) setActivePlacedObjects(data.placedObjects);
          } else {
            localStorage.removeItem('current_tracking_session');
          }
        }
      } catch (e) {
        console.error('Error parsing saved tracking session', e);
      }
    }
  }, []);

  // Auto-save
  useEffect(() => {
    if (isTracking && dogPoints.length > 0) {
      localStorage.setItem('current_tracking_session', JSON.stringify({
        dogPoints,
        foundObjects,
        trail: activeTrail,
        placedObjects: activePlacedObjects,
        timestamp: Date.now()
      }));
    }
  }, [dogPoints, foundObjects, isTracking, activeTrail, activePlacedObjects]);

  // GPS tracking with real geolocation
  useEffect(() => {
    if (!isTracking || isPaused) {
      geoService.stopWatching();
      return;
    }

    setGpsStatus('waiting');
    setGpsError('');

    // Start watching position
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

        setDogPoints(prev => {
          const updated = [...prev, newPoint];
          
          // Update live session if active
          if (liveSessionId || localLiveSessionId) {
            updateLiveSession(updated, foundObjects);
          }
          
          return updated;
        });

        // Auto-detect nearby objects
        activePlacedObjects.forEach(obj => {
          const isAlreadyFound = foundObjects.some(f => f.id === obj.id);
          if (!isAlreadyFound) {
            const distance = Math.sqrt(
              Math.pow((obj.lat - position.lat) * 111000, 2) +
              Math.pow((obj.lng - position.lng) * 111000, 2)
            );
            if (distance < 5) {
              setShowObjectPrompt(true);
            }
          }
        });
      },
      (error: GeoError) => {
        setGpsStatus('error');
        setGpsError(error.message);
        console.error('GPS error:', error);
      }
    );

    return () => {
      geoService.stopWatching();
    };
  }, [isTracking, isPaused, activePlacedObjects, foundObjects, liveSessionId, localLiveSessionId]);

  const updateLiveSession = async (points: TrailPoint[], objs: ObjectMarker[]) => {
    const sessionId = liveSessionId || localLiveSessionId;
    if (!sessionId) return;

    try {
      await apiClient.updateLiveSession(sessionId, {
        points,
        objects: objs,
        active: true,
      });
    } catch (error) {
      console.error('Error updating live session:', error);
    }
  };

  const handleStart = async () => {
    setIsTracking(true);
    setIsPaused(false);
    
    // Start live session
    if (dog && onStartLiveSession && !liveSessionId && !localLiveSessionId) {
      const sessionId = await onStartLiveSession(dog.id);
      if (sessionId) {
        setLocalLiveSessionId(sessionId);
      }
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleObjectFound = () => {
    if (dogPoints.length === 0) return;

    // Use last GPS position or last recorded point
    const lastPoint = lastPosition 
      ? { lat: lastPosition.lat, lng: lastPosition.lng }
      : dogPoints[dogPoints.length - 1];

    const newFoundObject: ObjectMarker = {
      id: Date.now().toString(),
      lat: lastPoint.lat,
      lng: lastPoint.lng,
      type: 'found',
      timestamp: Date.now(),
    };
    setFoundObjects(prev => {
      const updated = [...prev, newFoundObject];
      
      // Update live session
      if (liveSessionId || localLiveSessionId) {
        updateLiveSession(dogPoints, updated);
      }
      
      return updated;
    });
    setShowObjectPrompt(false);
  };

  const handleFinish = () => {
    if (dogPoints.length === 0) {
      alert('Спочатку запишіть роботу собаки');
      return;
    }
    localStorage.removeItem('current_tracking_session');
    setIsTracking(false);
    onFinish(dogPoints, foundObjects);
  };

  const handleCopySessionCode = () => {
    const sessionId = liveSessionId || localLiveSessionId;
    if (sessionId) {
      copyToClipboard(sessionId);
      setCopiedSessionCode(true);
      setTimeout(() => setCopiedSessionCode(false), 2000);
    }
  };

  const distance = dogPoints.length > 1 ? 
    dogPoints.reduce((sum, point, i) => {
      if (i === 0) return 0;
      const prev = dogPoints[i - 1];
      const R = 6371000;
      const dLat = (point.lat - prev.lat) * Math.PI / 180;
      const dLng = (point.lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return sum + R * c;
    }, 0) : 0;

  const duration = dogPoints.length > 0 ? 
    Math.floor((Date.now() - dogPoints[0].timestamp) / 1000) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 hover:bg-green-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1>Робота собаки</h1>
        </div>
        {dog && (
          <div className="text-sm text-green-100 text-center">Собака: {dog.name}</div>
        )}
      </div>

      {/* Map Area */}
      <div className="relative h-96 m-4 rounded-xl shadow-lg overflow-hidden">
        {(activeTrail.length > 0 || dogPoints.length > 0) ? (
          <ClientMapView
            trailPoints={activeTrail}
            dogPoints={dogPoints}
            placedObjects={activePlacedObjects}
            foundObjects={foundObjects}
            isLive={isTracking}
            currentPosition={lastPosition}
            showAccuracy={gpsStatus === 'active'}
            accuracy={currentAccuracy}
            className="h-full"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Почніть роботу для відображення карти</p>
            </div>
          </div>
        )}
        
        {/* Live Session Indicator */}
        {(liveSessionId || localLiveSessionId) && (
          <div className="absolute top-2 left-2 right-2 z-[1000]">
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Live-трекінг активний</span>
              </div>
              <button
                onClick={handleCopySessionCode}
                className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                {copiedSessionCode ? <CheckCircle size={12} /> : <Copy size={12} />}
                <span>{copiedSessionCode ? 'Скопійовано!' : liveSessionId || localLiveSessionId}</span>
              </button>
            </div>
          </div>
        )}

        {/* Status overlay */}
        {isTracking && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Відстань:</span>
                <span className="text-gray-800">{Math.round(distance)} м</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Час:</span>
                <span className="text-gray-800">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-green-600 mb-1">{Math.round(distance)}</div>
            <div className="text-xs text-gray-600">метрів</div>
            <div className="text-[10px] text-gray-400 mt-1">~{Math.round(distance / 0.75)} кроків</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-blue-600 mb-1">{dogPoints.length}</div>
            <div className="text-xs text-gray-600">точок</div>
          </div>
          <div className="text-center">
            <div className="text-orange-600 mb-1">{foundObjects.length}/{activePlacedObjects.length}</div>
            <div className="text-xs text-gray-600">знайдено</div>
          </div>
        </div>
      </div>

      {/* Object Detection Prompt */}
      {showObjectPrompt && (
        <div className="px-4 mb-6">
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <MapPin className="text-orange-600 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="text-orange-900 mb-2">Предмет поблизу!</h3>
                <p className="text-sm text-orange-800 mb-3">Собака знайшла предмет?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleObjectFound}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Так, знайдено
                  </button>
                  <button
                    onClick={() => setShowObjectPrompt(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Ні
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 pb-6 space-y-3">
        {!isTracking ? (
          <button
            onClick={handleStart}
            className="w-full bg-green-600 text-white p-5 rounded-xl shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-3"
          >
            <Play size={24} />
            <span>Почати роботу собаки</span>
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
                onClick={handleObjectFound}
                className="bg-orange-600 text-white p-5 rounded-xl shadow-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                <span>Предмет знайдено</span>
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-blue-600 text-white p-5 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
            >
              <CheckCircle size={24} />
              <span>Завершити роботу</span>
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!isTracking && (
        <div className="px-4 pb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-green-900 mb-2">Інструкції:</h3>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>Натисніть "Почати роботу собаки"</li>
              <li>Пустіть собаку працювати по сліду</li>
              <li>Підтверджуйте знайдені предмети</li>
              <li>Завершіть роботу для перегляду результатів</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
