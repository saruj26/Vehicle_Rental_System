import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, getAccessToken } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session: try /auth/me if a token exists, else attempt refresh.
  useEffect(() => {
    (async () => {
      try {
        if (getAccessToken()) {
          const { data } = await api.get('/auth/me');
          setUser(data.data.user);
        } else {
          const { data } = await api.post('/auth/refresh');
          setAccessToken(data.data.accessToken);
          setUser(data.data.user);
        }
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* noop */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => setUser((u) => ({ ...u, ...patch })), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
