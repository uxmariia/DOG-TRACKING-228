import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export function Auth({ onLogin, onSignup, onResetPassword }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Введіть ваше ім\'я');
        }
        await onSignup(email, password, name);
      } else if (mode === 'forgot') {
        await onResetPassword(email);
        setSuccessMessage('Інструкції з відновлення паролю відправлено на ваш email');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Помилка авторизації');
    } finally {
      if (mode !== 'forgot') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐕</div>
          <h1 className="text-gray-800 mb-2">DogTracker Pro</h1>
          <p className="text-gray-600">Професійний трекінг для службових собак</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Вхід
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  mode === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Реєстрація
              </button>
            </div>
          )}

          {mode === 'forgot' && (
             <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Відновлення паролю</h2>
                <p className="text-sm text-gray-600">Введіть ваш email для отримання інструкцій</p>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ваше ім'я</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Іван Петренко"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">Мінімум 6 символів</p>
                )}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Запам'ятати мене</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Забули пароль?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Завантаження...</span>
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={20} /> : mode === 'signup' ? <UserPlus size={20} /> : <Mail size={20} />}
                  <span>{mode === 'login' ? 'Увійти' : mode === 'signup' ? 'Зареєструватися' : 'Відновити пароль'}</span>
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                   setMode('login');
                   setError('');
                   setSuccessMessage('');
                }}
                className="w-full text-gray-600 py-2 hover:text-gray-800 transition-colors"
              >
                Повернутися до входу
              </button>
            )}
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="mb-2">
            <strong>Хмарна синхронізація:</strong>
          </p>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li>Ваші дані зберігаються в хмарі</li>
            <li>Доступ з будь-якого пристрою</li>
            <li>Обмін треками з колегами</li>
            <li>Live-трекінг для інструкторів</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
