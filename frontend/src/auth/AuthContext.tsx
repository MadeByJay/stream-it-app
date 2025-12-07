import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '../types/auth';
import { fetchCurrentUser, loginUser, registerUser } from '../api/authApi';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_TOKEN_STORAGE_KEY = 'miniFlixAuthToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount, try to hydrate from localStorage
  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const currentUser = await fetchCurrentUser(storedToken);
        setUser(currentUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to hydrate auth state', error);
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleLogin(email: string, password: string) {
    const authResponse = await loginUser(email, password);
    setUser(authResponse.user);
    setToken(authResponse.token);
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authResponse.token);
  }

  async function handleRegister(email: string, password: string) {
    const authResponse = await registerUser(email, password);
    setUser(authResponse.user);
    setToken(authResponse.token);
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authResponse.token);
  }

  function handleLogout() {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
