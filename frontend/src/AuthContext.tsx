import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth as authApi } from './api';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<User>;
  logout: () => void;
  setUserFromToken: (user: User, token?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (email: string, password: string) =>
    authApi.login({ email, password }).then(({ user, token }: any) => {
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    });

  const signup = (email: string, password: string, name: string) =>
    authApi.signup({ email, password, name }).then(({ user, token }: any) => {
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    });

  const setUserFromToken = (u: User, token?: string) => {
    if (token) localStorage.setItem('token', token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
