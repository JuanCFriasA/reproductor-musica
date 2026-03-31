/**
 * src/AuthContext.tsx
 * Provides login / register / logout + JWT token management.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user:      User | null;
  token:     string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout:   () => void;
}

export const API_BASE = 'http://localhost:4000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(() => localStorage.getItem('mc_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Verify stored token on mount
  useEffect(() => {
    if (!token) { setIsLoading(false); return; }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setUser(data);
        else      clearToken();
      })
      .catch(clearToken)
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearToken() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mc_token');
  }

  function saveToken(newToken: string, newUser: User) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mc_token', newToken);
  }

  async function login(email: string, password: string) {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    saveToken(data.token, data.user);
  }

  async function register(username: string, email: string, password: string) {
    const res  = await fetch(`${API_BASE}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    saveToken(data.token, data.user);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isLoggedIn: !!user, login, register, logout: clearToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}