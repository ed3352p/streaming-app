import { useState } from 'react';
import { Shield, Lock, Clock, Users, Save } from 'lucide-react';

export default function ParentalControlsSetup({ onSave, onCancel }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [settings, setSettings] = useState({
    maxRating: 'PG-13',
    blockedCategories: [],
    allowedHours: { start: '06:00', end: '22:00' },
    requirePinForPurchase: true,
    requirePinForMatureContent: true,
    screenTimeLimit: 120
  });
  const [error, setError] = useState('');

  const categories = [
    'horror', 'violence', 'adult', 'drugs', 'language'
  ];

  const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('Le code PIN doit contenir 4 chiffres');
      return;
    }

    if (pin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas');
      return;
    }

    try {
      const response = await fetch('/api/parental-controls/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pin, settings })
      });

      if (response.ok) {
        onSave && onSave();
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la configuration');
      }
    } catch (error) {
      setError('Erreur de connexion');
    }
  };

  const toggleCategory = (category) => {
    setSettings(prev => ({
      ...prev,
      blockedCategories: prev.blockedCategories.includes(category)
        ? prev.blockedCategories.filter(c => c !== category)
        : [...prev.blockedCategories, category]
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-500/20 p-3 rounded-full">
          <Shield className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Contrôle Parental</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Code PIN (4 chiffres)
            </label>
            <input
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              placeholder="••••"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Confirmer le code PIN
            </label>
            <input
              type="password"
              maxLength="4"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              placeholder="••••"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Classification maximale autorisée
          </label>
          <select
            value={settings.maxRating}
            onChange={(e) => setSettings({ ...settings, maxRating: e.target.value })}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3"
          >
            {ratings.map(rating => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white font-semibold mb-3">
            Catégories bloquées
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(category => (
              <label
                key={category}
                className="flex items-center gap-2 bg-gray-700 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-600 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.blockedCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-white capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Heures autorisées
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Début</label>
              <input
                type="time"
                value={settings.allowedHours.start}
                onChange={(e) => setSettings({
                  ...settings,
                  allowedHours: { ...settings.allowedHours, start: e.target.value }
                })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Fin</label>
              <input
                type="time"
                value={settings.allowedHours.end}
                onChange={(e) => setSettings({
                  ...settings,
                  allowedHours: { ...settings.allowedHours, end: e.target.value }
                })}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Limite de temps d'écran (minutes/jour)
          </label>
          <input
            type="number"
            min="0"
            value={settings.screenTimeLimit}
            onChange={(e) => setSettings({ ...settings, screenTimeLimit: parseInt(e.target.value) })}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requirePinForPurchase}
              onChange={(e) => setSettings({ ...settings, requirePinForPurchase: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">Exiger le PIN pour les achats</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requirePinForMatureContent}
              onChange={(e) => setSettings({ ...settings, requirePinForMatureContent: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-white">Exiger le PIN pour le contenu mature</span>
          </label>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
