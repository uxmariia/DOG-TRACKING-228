import { Track, Dog } from '../App';
import { ArrowLeft, MapPin, Clock, Target, TrendingUp, Award, Download, Share2 } from 'lucide-react';

interface TrackAnalysisProps {
  track: Track;
  dog?: Dog;
  onBack: () => void;
  onShare: () => void;
}

export function TrackAnalysis({ track, dog, onBack, onShare }: TrackAnalysisProps) {
  const accuracy = Math.max(0, 100 - track.stats.averageDeviation);
  const successRate = track.stats.objectsTotal > 0 
    ? (track.stats.objectsFound / track.stats.objectsTotal) * 100 
    : 0;

  const weatherIcons: { [key: string]: string } = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    foggy: '🌫️',
  };

  const surfaceIcons: { [key: string]: string } = {
    grass: '🌱',
    forest: '🌲',
    asphalt: '🛣️',
    sand: '🏖️',
    snow: '❄️',
    mixed: '🔀',
  };

  const handleExport = () => {
    alert('Експорт звіту у форматі PDF (функція в розробці)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1>Аналіз тренування</h1>
            <div className="text-sm text-blue-100">
              {dog?.name} • {new Date(track.date).toLocaleDateString('uk-UA')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-4">
        {/* Overall Score */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Award size={32} />
            <h2>Загальна оцінка</h2>
          </div>
          <div className="text-center">
            <div className="text-6xl mb-2">{Math.round((accuracy + successRate) / 2)}%</div>
            <div className="text-blue-100">Ефективність роботи</div>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-gray-800">Карта маршруту</h3>
          </div>
          <div className="relative bg-gradient-to-br from-green-100 to-green-200 h-64">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full">
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="green" strokeWidth="0.5"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Trail */}
            <div className="absolute inset-0 p-4">
              {track.trailPoints.map((point, i) => (
                <div
                  key={`trail-${i}`}
                  className="absolute w-2 h-2 bg-blue-500 rounded-full"
                  style={{
                    left: `${((point.lng - 30.52) * 10000) % 100}%`,
                    top: `${((point.lat - 50.45) * 10000) % 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Dog track */}
            <div className="absolute inset-0 p-4">
              {track.dogPoints.map((point, i) => (
                <div
                  key={`dog-${i}`}
                  className="absolute w-2 h-2 bg-green-600 rounded-full"
                  style={{
                    left: `${((point.lng - 30.52) * 10000) % 100}%`,
                    top: `${((point.lat - 50.45) * 10000) % 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Objects */}
            <div className="absolute inset-0 p-4">
              {track.objects.filter(o => o.type === 'placed').map((obj, i) => (
                <div
                  key={`placed-${obj.id}`}
                  className="absolute w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs"
                  style={{
                    left: `${((obj.lng - 30.52) * 10000) % 100}%`,
                    top: `${((obj.lat - 50.45) * 10000) % 100}%`,
                  }}
                >
                  {i + 1}
                </div>
              ))}
              {track.objects.filter(o => o.type === 'found').map((obj) => (
                <div
                  key={`found-${obj.id}`}
                  className="absolute w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{
                    left: `${((obj.lng - 30.52) * 10000) % 100}%`,
                    top: `${((obj.lat - 50.45) * 10000) % 100}%`,
                  }}
                >
                  ✓
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur rounded-lg p-2 text-xs">
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Слід</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">Собака</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Предмети</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-gray-800 mb-4">Ключові показники</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Target size={18} />
                  <span className="text-sm">Точність роботи</span>
                </div>
                <span className="text-green-600">{Math.round(accuracy)}%</span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Award size={18} />
                  <span className="text-sm">Знайдено предметів</span>
                </div>
                <span className="text-orange-600">{Math.round(successRate)}%</span>
              </div>
              <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-gray-800 mb-4">Детальна статистика</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <MapPin size={16} />
                <span className="text-xs">Довжина сліду</span>
              </div>
              <div className="text-gray-800">{Math.round(track.stats.trailDistance)} м</div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <MapPin size={16} />
                <span className="text-xs">Шлях собаки</span>
              </div>
              <div className="text-gray-800">{Math.round(track.stats.dogDistance)} м</div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Clock size={16} />
                <span className="text-xs">Тривалість</span>
              </div>
              <div className="text-gray-800">{Math.floor(track.stats.duration / 60)} хв {Math.round(track.stats.duration % 60)} с</div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <TrendingUp size={16} />
                <span className="text-xs">Середня швидкість</span>
              </div>
              <div className="text-gray-800">{track.stats.averageSpeed.toFixed(2)} м/с</div>
            </div>

            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <Target size={16} />
                <span className="text-xs">Серед. відхилення</span>
              </div>
              <div className="text-gray-800">{track.stats.averageDeviation.toFixed(1)} м</div>
            </div>

            <div className="bg-pink-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-pink-600 mb-1">
                <Target size={16} />
                <span className="text-xs">Макс. відхилення</span>
              </div>
              <div className="text-gray-800">{track.stats.maxDeviation.toFixed(1)} м</div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-gray-800 mb-4">Умови тренування</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Погода</span>
              <span className="text-gray-800">
                {weatherIcons[track.conditions.weather]} {track.conditions.temperature}°C
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Вітер</span>
              <span className="text-gray-800 capitalize">{track.conditions.wind}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Покриття</span>
              <span className="text-gray-800">{surfaceIcons[track.conditions.surface]}</span>
            </div>
            {track.conditions.notes && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600 block mb-1">Примітки</span>
                <p className="text-gray-800 text-sm bg-gray-50 p-2 rounded">{track.conditions.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="bg-blue-600 text-white p-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={20} />
            <span>Експорт PDF</span>
          </button>
          <button
            onClick={onShare}
            className="bg-green-600 text-white p-4 rounded-xl shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={20} />
            <span>Поділитися</span>
          </button>
        </div>
      </div>
    </div>
  );
}