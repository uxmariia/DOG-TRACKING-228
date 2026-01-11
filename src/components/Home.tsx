import { Dog, Track } from '../App';
import { MapPin, Users, History, BarChart3, Plus, Dog as DogIcon, Eye, LogOut } from 'lucide-react';

interface HomeProps {
  dogs: Dog[];
  tracks: Track[];
  user: any;
  onNavigate: (screen: 'home' | 'dogs' | 'create-trail' | 'track-dog' | 'history' | 'analysis' | 'stats' | 'share' | 'live') => void;
  onStartTrail: (dog: Dog) => void;
  onLogout: () => void;
}

export function Home({ dogs, tracks, user, onNavigate, onStartTrail, onLogout }: HomeProps) {
  const recentTracks = tracks.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-center mb-2">🐕 DogTracker Pro</h1>
            <p className="text-center text-blue-100 text-sm">Професійний трекінг для службових собак</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center justify-between mt-4 bg-blue-700/50 rounded-lg p-3">
            <div className="text-sm">
              <div className="text-blue-100">Привіт,</div>
              <div>{user.user_metadata?.name || user.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
              title="Вийти"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-blue-600 mb-1">{dogs.length}</div>
            <div className="text-xs text-gray-600">Собак</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-green-600 mb-1">{tracks.length}</div>
            <div className="text-xs text-gray-600">Тренувань</div>
          </div>
          <div className="text-center">
            <div className="text-purple-600 mb-1">
              {tracks.length > 0 ? Math.round(tracks.reduce((sum, t) => sum + t.stats.trailDistance, 0) / 1000) : 0}
            </div>
            <div className="text-xs text-gray-600">км пройдено</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="mb-3 text-gray-800">Швидкі дії</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('dogs')}
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="text-gray-800 mb-1">Мої собаки</div>
            <div className="text-xs text-gray-500">Керування профілями</div>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <History className="text-green-600" size={24} />
            </div>
            <div className="text-gray-800 mb-1">Історія</div>
            <div className="text-xs text-gray-500">Всі тренування</div>
          </button>

          <button
            onClick={() => onNavigate('stats')}
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <BarChart3 className="text-purple-600" size={24} />
            </div>
            <div className="text-gray-800 mb-1">Статистика</div>
            <div className="text-xs text-gray-500">Аналіз прогресу</div>
          </button>

          <button
            onClick={() => dogs.length > 0 ? onStartTrail(dogs[0]) : onNavigate('dogs')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left text-white"
          >
            <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <MapPin className="text-white" size={24} />
            </div>
            <div className="mb-1">Новий слід</div>
            <div className="text-xs text-orange-100">Почати тренування</div>
          </button>
        </div>

        {/* Live Tracking Button */}
        <button
          onClick={() => onNavigate('live')}
          className="w-full mt-3 bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow text-white flex items-center justify-center gap-2"
        >
          <Eye size={24} />
          <div>
            <div>Live-трекінг</div>
            <div className="text-xs text-green-100">Режим інструктора</div>
          </div>
        </button>
      </div>

      {/* Recent Tracks */}
      {recentTracks.length > 0 && (
        <div className="px-4">
          <h2 className="mb-3 text-gray-800">Останні тренування</h2>
          <div className="space-y-3">
            {recentTracks.map((track) => {
              const dog = dogs.find(d => d.id === track.dogId);
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    onNavigate('history');
                  }}
                  className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                        <DogIcon className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <div className="text-gray-800">{dog?.name || 'Невідомий'}</div>
                        <div className="text-xs text-gray-500">{new Date(track.date).toLocaleDateString('uk-UA')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">{Math.round(track.stats.trailDistance)} м</div>
                      <div className="text-xs text-gray-500">{Math.round(track.stats.duration / 60)} хв</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="text-gray-600">
                      Точність: <span className="text-green-600">{Math.round(100 - track.stats.averageDeviation)}%</span>
                    </div>
                    <div className="text-gray-600">
                      Предмети: <span className="text-blue-600">{track.stats.objectsFound}/{track.stats.objectsTotal}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dogs.length === 0 && (
        <div className="px-4 mt-12">
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-blue-600" size={32} />
            </div>
            <h3 className="text-gray-800 mb-2">Додайте свою першу собаку</h3>
            <p className="text-sm text-gray-600 mb-4">Почніть з створення профілю вашої собаки</p>
            <button
              onClick={() => onNavigate('dogs')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Додати собаку
            </button>
          </div>
        </div>
      )}
    </div>
  );
}