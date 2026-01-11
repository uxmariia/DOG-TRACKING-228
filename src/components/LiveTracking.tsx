import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Eye, Users, Wifi } from 'lucide-react';
import { apiClient } from '../utils/api';

interface LiveTrackingProps {
  onBack: () => void;
}

export function LiveTracking({ onBack }: LiveTrackingProps) {
  const [sessionCode, setSessionCode] = useState('');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh || !sessionCode) return;

    const interval = setInterval(() => {
      loadSession(sessionCode);
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, sessionCode]);

  const loadSession = async (code: string) => {
    try {
      const { session: liveSession } = await apiClient.getLiveSession(code);
      setSession(liveSession);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Сесію не знайдено');
      setSession(null);
    }
  };

  const handleConnect = async () => {
    if (!sessionCode.trim()) return;

    setLoading(true);
    await loadSession(sessionCode.trim());
    setLoading(false);
    setAutoRefresh(true);
  };

  const handleDisconnect = () => {
    setSession(null);
    setSessionCode('');
    setAutoRefresh(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-green-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1>Live-трекінг</h1>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-4">
        {!session ? (
          /* Connect to Session */
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="text-green-600" size={32} />
              </div>
              <h3 className="text-gray-800 mb-2">Режим інструктора</h3>
              <p className="text-sm text-gray-600">
                Підключіться до активного тренування для перегляду в реальному часі
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl tracking-wider"
                placeholder="Код сесії"
                maxLength={8}
              />
              <button
                onClick={handleConnect}
                disabled={loading || !sessionCode.trim()}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Підключення...</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>Підключитися</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-2 text-sm">Як використовувати:</h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Попросіть учня почати тренування з Live-трекінгом</li>
                <li>Учень повинен поділитися кодом сесії</li>
                <li>Введіть код та підключіться</li>
                <li>Спостерігайте за роботою в реальному часі</li>
              </ol>
            </div>
          </div>
        ) : (
          /* View Session */
          <div className="space-y-4">
            {/* Session Info */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${session.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    {session.active ? 'Активна сесія' : 'Завершена'}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Відключитися
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-blue-600 text-xl mb-1">{session.points?.length || 0}</div>
                  <div className="text-xs text-gray-600">точок</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-orange-600 text-xl mb-1">{session.objects?.length || 0}</div>
                  <div className="text-xs text-gray-600">об'єктів</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-green-600 text-xl mb-1">
                    {session.startedAt ? Math.floor((Date.now() - session.startedAt) / 60000) : 0}
                  </div>
                  <div className="text-xs text-gray-600">хвилин</div>
                </div>
              </div>
            </div>

            {/* Live Map */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-gray-800">Карта в реальному часі</h3>
                <div className="flex items-center gap-2 text-green-600">
                  <Wifi size={16} />
                  <span className="text-xs">Онлайн</span>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-green-100 to-green-200 h-96">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full">
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="green" strokeWidth="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Points */}
                <div className="absolute inset-0 p-4">
                  {session.points?.map((point: any, i: number) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-blue-600 rounded-full shadow-lg"
                      style={{
                        left: `${((point.lng - 30.52) * 10000) % 100}%`,
                        top: `${((point.lat - 50.45) * 10000) % 100}%`,
                      }}
                    />
                  ))}
                  
                  {/* Current position (last point) */}
                  {session.points?.length > 0 && (
                    <div
                      className="absolute w-6 h-6 bg-green-500 rounded-full shadow-lg border-2 border-white animate-pulse"
                      style={{
                        left: `${((session.points[session.points.length - 1].lng - 30.52) * 10000) % 100}%`,
                        top: `${((session.points[session.points.length - 1].lat - 50.45) * 10000) % 100}%`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                        🐕
                      </div>
                    </div>
                  )}

                  {/* Objects */}
                  {session.objects?.map((obj: any, i: number) => (
                    <div
                      key={obj.id}
                      className="absolute w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg"
                      style={{
                        left: `${((obj.lng - 30.52) * 10000) % 100}%`,
                        top: `${((obj.lat - 50.45) * 10000) % 100}%`,
                      }}
                    >
                      {obj.type === 'found' ? '✓' : i + 1}
                    </div>
                  ))}
                </div>

                {/* Auto-refresh indicator */}
                {autoRefresh && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Оновлюється</span>
                  </div>
                )}
              </div>
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-gray-800 mb-3">Деталі сесії</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Тип:</span>
                  <span className="text-gray-800 capitalize">{session.type === 'trail' ? 'Слід' : 'Робота собаки'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Початок:</span>
                  <span className="text-gray-800">
                    {new Date(session.startedAt).toLocaleTimeString('uk-UA')}
                  </span>
                </div>
                {session.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Завершення:</span>
                    <span className="text-gray-800">
                      {new Date(session.endedAt).toLocaleTimeString('uk-UA')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Код сесії:</span>
                  <span className="text-blue-600 font-mono">{session.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
