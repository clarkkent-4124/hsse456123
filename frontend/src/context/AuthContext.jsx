import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hsse-user')) || null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  async function login(username, password) {
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      const { token, user: userData } = res.data;
      if (!token || !userData) {
        throw new Error('Response login tidak valid. Periksa konfigurasi backend.');
      }
      localStorage.setItem('hsse-token', token);
      localStorage.setItem('hsse-user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('hsse-token');
    localStorage.removeItem('hsse-user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
