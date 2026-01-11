import { useState } from 'react';
import { Dog } from '../App';
import { Plus, ArrowLeft, Trash2, Calendar, Award, Pencil } from 'lucide-react';

interface DogProfilesProps {
  dogs: Dog[];
  onAddDog: (dog: Dog) => void;
  onUpdateDog: (dog: Dog) => void;
  onDeleteDog: (id: string) => void;
  onBack: () => void;
}

export function DogProfiles({ dogs, onAddDog, onUpdateDog, onDeleteDog, onBack }: DogProfilesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birthDate: '',
    specialization: 'tracking',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const updatedDog: Dog = {
        id: editingId,
        ...formData,
      };
      onUpdateDog(updatedDog);
    } else {
      const newDog: Dog = {
        id: Date.now().toString(),
        ...formData,
      };
      onAddDog(newDog);
    }
    
    resetForm();
  };

  const handleEdit = (dog: Dog) => {
    setFormData({
      name: dog.name,
      breed: dog.breed,
      birthDate: dog.birthDate,
      specialization: dog.specialization,
    });
    setEditingId(dog.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', breed: '', birthDate: '', specialization: 'tracking' });
    setEditingId(null);
    setShowForm(false);
  };

  const specializations = [
    { value: 'tracking', label: 'Трекінг (IGP)' },
    { value: 'search', label: 'Пошук і порятунок' },
    { value: 'detection', label: 'Детекція' },
    { value: 'hunting', label: 'Мисливство' },
    { value: 'other', label: 'Інше' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1>Мої собаки</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Add Dog Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 text-white p-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors mb-6 flex items-center justify-center gap-2"
          >
            <Plus size={24} />
            <span>Додати собаку</span>
          </button>
        )}

        {/* Add Dog Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="mb-4 text-gray-800">{editingId ? 'Редагування профілю' : 'Новий профіль собаки'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ім'я собаки *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Наприклад: Рекс"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Порода *</label>
                <input
                  type="text"
                  required
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Наприклад: Німецька вівчарка"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Дата народження *</label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Спеціалізація *</label>
                <select
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {specializations.map(spec => (
                    <option key={spec.value} value={spec.value}>{spec.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dogs List */}
        <div className="space-y-4">
          {dogs.map((dog) => {
            const age = dog.birthDate ? Math.floor((Date.now() - new Date(dog.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
            const spec = specializations.find(s => s.value === dog.specialization);

            return (
              <div key={dog.id} className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                      🐕
                    </div>
                    <div>
                      <h3 className="text-gray-800 mb-1">{dog.name}</h3>
                      <p className="text-sm text-gray-600">{dog.breed}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(dog)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Видалити профіль ${dog.name}?`)) {
                          onDeleteDog(dog.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar size={16} />
                      <span className="text-xs">Вік</span>
                    </div>
                    <div className="text-gray-800">{age ? `${age} ${age === 1 ? 'рік' : age < 5 ? 'роки' : 'років'}` : 'Невідомо'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Award size={16} />
                      <span className="text-xs">Спеціалізація</span>
                    </div>
                    <div className="text-gray-800 text-sm">{spec?.label || 'Невідомо'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {dogs.length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600 mb-4">Ще немає собак</p>
            <p className="text-sm text-gray-500">Додайте профіль своєї собаки для початку</p>
          </div>
        )}
      </div>
    </div>
  );
}
