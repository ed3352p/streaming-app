import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ContentWarning({ warning, onAccept, onDecline }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!warning) return null;

  const handleAccept = () => {
    if (warning.requireAcknowledgment && !acknowledged) {
      return;
    }
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-white">{warning.title}</h2>
          </div>
          {onDecline && (
            <button
              onClick={onDecline}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-gray-300">{warning.message}</p>

        {warning.warnings && warning.warnings.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Ce contenu contient :</h3>
            <ul className="space-y-1">
              {warning.warnings.map((item, index) => (
                <li key={index} className="text-gray-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warning.ageGate && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 font-semibold">
              Réservé aux personnes de {warning.ageGate} ans et plus
            </p>
          </div>
        )}

        {warning.requireAcknowledgment && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-gray-300">
              Je comprends et j'accepte de visionner ce contenu sensible
            </span>
          </label>
        )}

        <div className="flex gap-3 pt-2">
          {onDecline && (
            <button
              onClick={onDecline}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleAccept}
            disabled={warning.requireAcknowledgment && !acknowledged}
            className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
              warning.requireAcknowledgment && !acknowledged
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
