import { Track, Dog } from '../App';
import { ArrowLeft, TrendingUp, Award, Calendar, MapPin, Target } from 'lucide-react';

interface StatisticsProps {
  tracks: Track[];
  dogs: Dog[];
  onBack: () => void;
}

export function Statistics({ tracks, dogs, onBack }: StatisticsProps) {
  const totalTracks = tracks.length;
  const totalDistance = tracks.reduce((sum, t) => sum + t.stats.trailDistance, 0);
  const totalDuration = tracks.reduce((sum, t) => sum + t.stats.duration, 0);
  const averageAccuracy = tracks.length > 0
    ? tracks.reduce((sum, t) => sum + (100 - t.stats.averageDeviation), 0) / tracks.length
    : 0;
  const totalObjectsFound = tracks.reduce((sum, t) => sum + t.stats.objectsFound, 0);
  const totalObjectsPlaced = tracks.reduce((sum, t) => sum + t.stats.objectsTotal, 0);
  const objectSuccessRate = totalObjectsPlaced > 0
    ? (totalObjectsFound / totalObjectsPlaced) * 100
    : 0;

  // Stats per dog
  const dogStats = dogs.map(dog => {
    const dogTracks = tracks.filter(t => t.dogId === dog.id);
    const dogDistance = dogTracks.reduce((sum, t) => sum + t.stats.trailDistance, 0);
    const dogAccuracy = dogTracks.length > 0
      ? dogTracks.reduce((sum, t) => sum + (100 - t.stats.averageDeviation), 0) / dogTracks.length
      : 0;
    const dogObjectsFound = dogTracks.reduce((sum, t) => sum + t.stats.objectsFound, 0);
    const dogObjectsTotal = dogTracks.reduce((sum, t) => sum + t.stats.objectsTotal, 0);
    
    return {
      dog,
      trackCount: dogTracks.length,
      totalDistance: dogDistance,
      averageAccuracy: dogAccuracy,
      objectSuccessRate: dogObjectsTotal > 0 ? (dogObjectsFound / dogObjectsTotal) * 100 : 0,
    };
  });

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTracks = tracks.filter(t => new Date(t.date) >= thirtyDaysAgo);

  // Monthly progress
  const getMonthKey = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthlyData = tracks.reduce((acc, track) => {
    const key = getMonthKey(track.date);
    if (!acc[key]) {
      acc[key] = { count: 0, distance: 0 };
    }
    acc[key].count++;
    acc[key].distance += track.stats.trailDistance;
    return acc;
  }, {} as Record<string, { count: number; distance: number }>);

  const last6Months = Object.entries(monthlyData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-purple-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1>Статистика та прогрес</h1>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-4">
        {/* Overall Stats */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
          <h2 className="mb-4">Загальна статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl mb-1">{totalTracks}</div>
              <div className="text-purple-100 text-sm">Тренувань</div>
            </div>
            <div>
              <div className="text-3xl mb-1">{Math.round(totalDistance / 1000)}</div>
              <div className="text-purple-100 text-sm">км пройдено</div>
            </div>
            <div>
              <div className="text-3xl mb-1">{Math.round(averageAccuracy)}</div>
              <div className="text-purple-100 text-sm">% точність</div>
            </div>
            <div>
              <div className="text-3xl mb-1">{Math.round(totalDuration / 3600)}</div>
              <div className="text-purple-100 text-sm">годин</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-600" size={20} />
            <h3 className="text-gray-800">Активність за 30 днів</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-blue-600 text-2xl mb-1">{recentTracks.length}</div>
              <div className="text-xs text-gray-600">тренувань</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-green-600 text-2xl mb-1">
                {Math.round(recentTracks.reduce((sum, t) => sum + t.stats.trailDistance, 0) / 1000)}
              </div>
              <div className="text-xs text-gray-600">км</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-purple-600 text-2xl mb-1">
                {recentTracks.length > 0
                  ? Math.round(recentTracks.reduce((sum, t) => sum + (100 - t.stats.averageDeviation), 0) / recentTracks.length)
                  : 0}
              </div>
              <div className="text-xs text-gray-600">% точність</div>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        {last6Months.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-600" size={20} />
              <h3 className="text-gray-800">Прогрес по місяцях</h3>
            </div>
            <div className="space-y-3">
              {last6Months.map(([month, data]) => {
                const maxCount = Math.max(...last6Months.map(m => m[1].count));
                const percentage = (data.count / maxCount) * 100;
                const date = new Date(month + '-01');
                const monthName = date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

                return (
                  <div key={month}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700 capitalize">{monthName}</span>
                      <span className="text-sm text-gray-600">{data.count} • {Math.round(data.distance)} м</span>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Objects Performance */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-orange-600" size={20} />
            <h3 className="text-gray-800">Робота з предметами</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">Успішність знаходження</span>
                <span className="text-orange-600">{Math.round(objectSuccessRate)}%</span>
              </div>
              <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${objectSuccessRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-orange-600 text-2xl mb-1">{totalObjectsFound}</div>
                <div className="text-xs text-gray-600">знайдено</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg text-center">
                <div className="text-gray-600 text-2xl mb-1">{totalObjectsPlaced}</div>
                <div className="text-xs text-gray-600">всього</div>
              </div>
            </div>
          </div>
        </div>

        {/* Per Dog Statistics */}
        {dogStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-blue-600" size={20} />
              <h3 className="text-gray-800">Статистика по собаках</h3>
            </div>
            <div className="space-y-4">
              {dogStats.map(stat => (
                <div key={stat.dog.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                      🐕
                    </div>
                    <div>
                      <div className="text-gray-800">{stat.dog.name}</div>
                      <div className="text-xs text-gray-500">{stat.dog.breed}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs text-gray-600 mb-1">Тренувань</div>
                      <div className="text-blue-600">{stat.trackCount}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-xs text-gray-600 mb-1">Відстань</div>
                      <div className="text-green-600">{Math.round(stat.totalDistance)} м</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-xs text-gray-600 mb-1">Точність</div>
                      <div className="text-purple-600">{Math.round(stat.averageAccuracy)}%</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                      <div className="text-xs text-gray-600 mb-1">Предмети</div>
                      <div className="text-orange-600">{Math.round(stat.objectSuccessRate)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalTracks === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 mb-2">Ще немає даних</p>
            <p className="text-sm text-gray-500">Статистика з'явиться після перших тренувань</p>
          </div>
        )}
      </div>
    </div>
  );
}
