import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Session invalide:', err);
          localStorage.removeItem('token');
        }
      }
      
      setInitialized(true);
      setLoading(false);
    };
    
    checkSession();
  }, []);

  // Login function - utilise l'API backend
  const login = async (identifier, password) => {
    const userData = await api.login(identifier, password);
    setUser(userData);
    return userData;
  };

  // Register function - utilise l'API backend
  const register = async (userData) => {
    const { email, username, password, name } = userData;
    const newUser = await api.register({ email, username, password, name });
    setUser(newUser);
    return newUser;
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    api.logout();
    setUser(null);
  }, []);

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('Non connecté');
    // TODO: Implémenter via API
    setUser(prev => ({ ...prev, ...updates }));
  };

  // Clear mustChangePassword flag after password change
  const clearMustChangePassword = () => {
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  // Check if user is premium
  const isPremium = user?.premium || user?.role === 'admin';

  // Check if user must change password
  const mustChangePassword = user?.mustChangePassword || false;

  const value = {
    user,
    loading,
    initialized,
    login,
    logout,
    register,
    updateProfile,
    clearMustChangePassword,
    isAdmin,
    isPremium,
    mustChangePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
