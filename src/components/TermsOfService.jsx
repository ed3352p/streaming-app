import { useState } from 'react';
import { FileText, Shield, Cookie, CheckCircle } from 'lucide-react';

export default function TermsOfService({ onAccept }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [activeTab, setActiveTab] = useState('terms');

  const handleAccept = async () => {
    if (!acceptedTerms || !acceptedPrivacy || !acceptedCookies) {
      alert('Vous devez accepter tous les documents obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/terms/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          termsVersion: '1.0',
          privacyVersion: '1.0',
          cookieVersion: '1.0',
          acceptedTerms,
          acceptedPrivacy,
          acceptedCookies,
          marketingConsent,
          ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => 'unknown'),
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        onAccept && onAccept();
      }
    } catch (error) {
      console.error('Terms acceptance error:', error);
    }
  };

  const tabs = [
    { id: 'terms', label: 'Conditions d\'utilisation', icon: FileText },
    { id: 'privacy', label: 'Politique de confidentialité', icon: Shield },
    { id: 'cookies', label: 'Politique des cookies', icon: Cookie }
  ];

  const content = {
    terms: `
      <h2>Conditions Générales d'Utilisation</h2>
      
      <h3>1. Acceptation des conditions</h3>
      <p>En accédant et en utilisant ce service de streaming, vous acceptez d'être lié par ces conditions générales d'utilisation.</p>
      
      <h3>2. Utilisation du service</h3>
      <p>Vous vous engagez à utiliser le service uniquement à des fins légales et conformément à ces conditions.</p>
      
      <h3>3. Compte utilisateur</h3>
      <p>Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe.</p>
      
      <h3>4. Contenu</h3>
      <p>Le contenu fourni est protégé par des droits d'auteur. Toute reproduction non autorisée est interdite.</p>
      
      <h3>5. Restrictions</h3>
      <p>Il est interdit de :</p>
      <ul>
        <li>Enregistrer, copier ou redistribuer le contenu</li>
        <li>Utiliser des outils d'enregistrement d'écran</li>
        <li>Partager votre compte avec des tiers</li>
        <li>Utiliser des VPN ou proxies pour contourner les restrictions géographiques</li>
      </ul>
      
      <h3>6. Résiliation</h3>
      <p>Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de violation de ces conditions.</p>
    `,
    privacy: `
      <h2>Politique de Confidentialité</h2>
      
      <h3>1. Collecte des données</h3>
      <p>Nous collectons les informations suivantes :</p>
      <ul>
        <li>Informations de compte (email, nom d'utilisateur)</li>
        <li>Données d'utilisation (historique de visionnage, préférences)</li>
        <li>Données techniques (adresse IP, type d'appareil, empreinte digitale)</li>
      </ul>
      
      <h3>2. Utilisation des données</h3>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Fournir et améliorer nos services</li>
        <li>Personnaliser votre expérience</li>
        <li>Détecter et prévenir les fraudes</li>
        <li>Respecter nos obligations légales</li>
      </ul>
      
      <h3>3. Partage des données</h3>
      <p>Nous ne vendons pas vos données personnelles. Nous pouvons partager vos données avec :</p>
      <ul>
        <li>Prestataires de services tiers (paiement, hébergement)</li>
        <li>Autorités légales si requis par la loi</li>
      </ul>
      
      <h3>4. Vos droits</h3>
      <p>Vous avez le droit de :</p>
      <ul>
        <li>Accéder à vos données personnelles</li>
        <li>Rectifier vos données</li>
        <li>Supprimer votre compte et vos données</li>
        <li>Vous opposer au traitement de vos données</li>
      </ul>
      
      <h3>5. Sécurité</h3>
      <p>Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données.</p>
    `,
    cookies: `
      <h2>Politique des Cookies</h2>
      
      <h3>1. Qu'est-ce qu'un cookie ?</h3>
      <p>Les cookies sont de petits fichiers texte stockés sur votre appareil lors de votre visite sur notre site.</p>
      
      <h3>2. Types de cookies utilisés</h3>
      
      <h4>Cookies essentiels</h4>
      <p>Nécessaires au fonctionnement du site (authentification, sécurité).</p>
      
      <h4>Cookies de performance</h4>
      <p>Nous aident à comprendre comment vous utilisez notre site.</p>
      
      <h4>Cookies de fonctionnalité</h4>
      <p>Mémorisent vos préférences (langue, qualité vidéo).</p>
      
      <h4>Cookies publicitaires</h4>
      <p>Utilisés pour afficher des publicités pertinentes.</p>
      
      <h3>3. Gestion des cookies</h3>
      <p>Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.</p>
      
      <h3>4. Cookies tiers</h3>
      <p>Certains cookies sont placés par des services tiers (analytics, publicité).</p>
    `
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">Documents légaux</h1>
          
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content[activeTab] }}
            style={{
              color: '#e5e7eb',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          />
        </div>

        <div className="p-6 border-t border-gray-700 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-white">
              J'accepte les <strong>Conditions Générales d'Utilisation</strong> *
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-white">
              J'accepte la <strong>Politique de Confidentialité</strong> *
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedCookies}
              onChange={(e) => setAcceptedCookies(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-white">
              J'accepte la <strong>Politique des Cookies</strong> *
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
            />
            <span className="text-gray-300">
              J'accepte de recevoir des communications marketing (optionnel)
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!acceptedTerms || !acceptedPrivacy || !acceptedCookies}
            className={`w-full font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              acceptedTerms && acceptedPrivacy && acceptedCookies
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Accepter et continuer
          </button>

          <p className="text-gray-400 text-sm text-center">
            * Champs obligatoires
          </p>
        </div>
      </div>
    </div>
  );
}
