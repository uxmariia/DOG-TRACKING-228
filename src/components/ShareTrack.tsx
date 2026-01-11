import { useState } from 'react';
import { Track } from '../App';
import { ArrowLeft, Share2, Copy, Download, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { apiClient } from '../utils/api';
import { copyToClipboard } from '../utils/utils';

interface ShareTrackProps {
  track: Track | null;
  onBack: () => void;
}

export function ShareTrack({ track, onBack }: ShareTrackProps) {
  const [shareMode, setShareMode] = useState<'generate' | 'import'>('generate');
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importedTrack, setImportedTrack] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerateCode = async () => {
    if (!track) return;

    setLoading(true);
    setError('');

    try {
      const { shareCode: code } = await apiClient.shareTrack(track.id);
      setShareCode(code);
    } catch (err: any) {
      setError(err.message || 'Помилка створення коду');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    copyToClipboard(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewShared = async () => {
    if (!importCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { track: sharedTrack } = await apiClient.getSharedTrack(importCode.trim());
      setImportedTrack(sharedTrack);
    } catch (err: any) {
      setError(err.message || 'Трек не знайдено');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTrack = async () => {
    if (!importCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.importSharedTrack(importCode.trim());
      alert('Трек успішно імпортовано! Перегляньте його в історії тренувань.');
      setImportCode('');
      setImportedTrack(null);
    } catch (err: any) {
      setError(err.message || 'Помилка імпорту');
    } finally {
      setLoading(false);
    }
  };

  const handleExportGPX = async () => {
    if (!track) return;

    setLoading(true);
    setError('');

    try {
      const blob = await apiClient.exportTrackGPX(track.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `track-${track.id}.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Помилка експорту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1>Обмін треками</h1>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-4">
        {/* Mode Selector */}
        <div className="flex gap-2 bg-white p-1 rounded-lg shadow-md">
          <button
            onClick={() => setShareMode('generate')}
            className={`flex-1 py-3 rounded-lg transition-colors ${
              shareMode === 'generate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Поділитися
          </button>
          <button
            onClick={() => setShareMode('import')}
            className={`flex-1 py-3 rounded-lg transition-colors ${
              shareMode === 'import'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Імпортувати
          </button>
        </div>

        {/* Generate Share Code */}
        {shareMode === 'generate' && (
          <div className="space-y-4">
            {!shareCode ? (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center mb-4">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Share2 className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-gray-800 mb-2">Поділитися тренуванням</h3>
                  <p className="text-sm text-gray-600">
                    Створіть код для обміну результатами тренування з колегами
                  </p>
                </div>
                <button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Створення...' : 'Створити код'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center mb-4">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-gray-800 mb-2">Код створено!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Поділіться цим кодом з колегами
                  </p>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                    <div className="text-3xl tracking-wider text-blue-600 mb-2">
                      {shareCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-2 mx-auto text-blue-600 hover:text-blue-700"
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={16} />
                          <span className="text-sm">Скопійовано!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span className="text-sm">Копіювати код</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShareCode('')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Створити новий код
                </button>
              </div>
            )}

            {/* Export GPX */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start gap-3 mb-4">
                <Download className="text-green-600 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="text-gray-800 mb-1">Експорт GPX</h3>
                  <p className="text-sm text-gray-600">
                    Завантажте трек у форматі GPX для використання в інших додатках
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportGPX}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Завантаження...' : 'Завантажити GPX'}
              </button>
            </div>
          </div>
        )}

        {/* Import Track */}
        {shareMode === 'import' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center mb-4">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <LinkIcon className="text-purple-600" size={32} />
                </div>
                <h3 className="text-gray-800 mb-2">Імпорт тренування</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Введіть код, яким з вами поділилися
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl tracking-wider"
                  placeholder="XXXXXX"
                  maxLength={8}
                />
                <button
                  onClick={handleViewShared}
                  disabled={loading || !importCode.trim()}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Пошук...' : 'Переглянути трек'}
                </button>
              </div>
            </div>

            {importedTrack && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-gray-800 mb-4">Знайдений трек</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Дата:</span>
                    <span className="text-gray-800">
                      {new Date(importedTrack.date).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Відстань:</span>
                    <span className="text-gray-800">{Math.round(importedTrack.stats.trailDistance)} м</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Час:</span>
                    <span className="text-gray-800">{Math.round(importedTrack.stats.duration / 60)} хв</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Точність:</span>
                    <span className="text-green-600">
                      {Math.round(100 - importedTrack.stats.averageDeviation)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleImportTrack}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Імпорт...' : 'Імпортувати в мою історію'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}