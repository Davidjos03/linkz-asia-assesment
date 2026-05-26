import { useState, useEffect, useCallback } from 'react';
import { api, type User } from '../api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: current } = await api.me();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const { user: loggedIn } = await api.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return { user, loading, login, logout, refresh };
}
