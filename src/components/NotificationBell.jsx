import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, requestPermission, permission } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Bell size={20} color="#8b5cf6" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          maxWidth: '90vw',
          background: '#1e293b',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8b5cf6',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCheck size={16} />
                Tout marquer lu
              </button>
            )}
          </div>

          {permission !== 'granted' && (
            <div style={{
              padding: '16px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#94a3b8' }}>
                Activez les notifications pour ne rien manquer
              </p>
              <button
                onClick={handleEnableNotifications}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Activer les notifications
              </button>
            </div>
          )}

          <div style={{
            overflowY: 'auto',
            flex: 1,
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b',
              }}>
                <Bell size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                    background: notif.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            background: '#8b5cf6',
                            borderRadius: '50%',
                          }} />
                        )}
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#94a3b8' }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(notif.timestamp).toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
