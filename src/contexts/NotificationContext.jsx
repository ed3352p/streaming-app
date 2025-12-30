import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState('default');
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const showNotification = useCallback((title, options = {}) => {
    const notification = {
      id: Date.now(),
      title,
      message: options.body || '',
      type: options.type || 'info',
      timestamp: new Date(),
      read: false,
      ...options,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));

    if (permission === 'granted' && !document.hasFocus()) {
      new Notification(title, {
        body: options.body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: options.tag || 'default',
        ...options,
      });
    }

    return notification.id;
  }, [permission]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permission,
        requestPermission,
        showNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
