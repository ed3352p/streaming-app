import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#cbd5e1',
          fontSize: '14px',
        }}
      >
        <Globe size={18} />
        <span>{currentLang.flag}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#1e293b',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          minWidth: '150px',
        }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: i18n.language === lang.code ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = i18n.language === lang.code ? 'rgba(139, 92, 246, 0.1)' : 'transparent'}
            >
              <span style={{ fontSize: '20px' }}>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
