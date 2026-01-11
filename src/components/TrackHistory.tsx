import { useState } from 'react';
import { Track, Dog } from '../App';
import { ArrowLeft, Calendar, MapPin, Clock, Target, ChevronRight, Filter } from 'lucide-react';

interface TrackHistoryProps {
  tracks: Track[];
  dogs: Dog[];
  onSelectTrack: (track: Track) => void;
  onBack: () => void;
}

export function TrackHistory({ tracks, dogs, onSelectTrack, onBack }: TrackHistoryProps) {
  const [selectedDog, setSelectedDog] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'accuracy'>('date');

  const filteredTracks = selectedDog === 'all' 
    ? tracks 
    : tracks.filter(t => t.dogId === selectedDog);

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'distance') {
      return b.stats.trailDistance - a.stats.trailDistance;
    } else {
      return b.stats.averageDeviation - a.stats.averageDeviation;
    }
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1>Історія тренувань</h1>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <select
            value={selectedDog}
            onChange={(e) => setSelectedDog(e.target.value)}
            className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="all">Всі собаки</option>
            {dogs.map(dog => (
              <option key={dog.id} value={dog.id}>{dog.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="date">За датою</option>
            <option value="distance">За відстанню</option>
            <option value="accuracy">За точністю</option>
          </select>
        </div>
      </div>

      {/* Track List */}
      <div className="p-4 space-y-3">
        {sortedTracks.map((track) => {
          const dog = dogs.find(d => d.id === track.dogId);
          const accuracy = Math.max(0, 100 - track.stats.averageDeviation);
          const successRate = track.stats.objectsTotal > 0 
            ? (track.stats.objectsFound / track.stats.objectsTotal) * 100 
            : 0;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div>
                    <div className="text-gray-800">{dog?.name || 'Невідомий'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(track.date).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <MapPin size={14} />
                    <span className="text-xs">Відстань</span>
                  </div>
                  <div className="text-gray-800">{Math.round(track.stats.trailDistance)} м</div>
                </div>

                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <Clock size={14} />
                    <span className="text-xs">Час</span>
                  </div>
                  <div className="text-gray-800">{Math.round(track.stats.duration / 60)} хв</div>
                </div>

                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <Target size={14} />
                    <span className="text-xs">Точність</span>
                  </div>
                  <div className="text-green-600">{Math.round(accuracy)}%</div>
                </div>

                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <span className="text-xs">Предмети</span>
                  </div>
                  <div className="text-orange-600">
                    {track.stats.objectsFound}/{track.stats.objectsTotal} 
                    <span className="text-xs text-gray-600 ml-1">
                      ({Math.round(successRate)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="flex gap-2 text-xs">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {weatherIcons[track.conditions.weather]} {track.conditions.temperature}°C
                </span>
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                  {surfaceIcons[track.conditions.surface]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedTracks.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 mb-2">Немає записів</p>
          <p className="text-sm text-gray-500">
            {selectedDog === 'all' 
              ? 'Почніть перше тренування' 
              : 'Немає тренувань для обраної собаки'}
          </p>
        </div>
      )}
    </div>
  );
}
