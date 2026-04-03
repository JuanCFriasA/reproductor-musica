import React, { createContext, useContext } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';

// ── Types ─────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  tokenReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const API_BASE = 'http://localhost:4000';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken, userId } = useClerkAuth();
  const { signOut } = useClerk();

  // Map Clerk user to our local User type
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    username: clerkUser.username || clerkUser.firstName || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    avatarUrl: (clerkUser as any).hasImage ? clerkUser.imageUrl : null,
  } : null;

  const login = async () => {
    // This is now handled by Clerk's UI or hooks
    console.warn("Manual login called. Use Clerk SignIn instead.");
  };

  const register = async () => {
    // This is now handled by Clerk's UI or hooks
    console.warn("Manual register called. Use Clerk SignUp instead.");
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token: null, // Tokens should be fetched via getToken() as needed
        isLoading: !isLoaded, 
        isLoggedIn: !!userId, 
        tokenReady: isLoaded,
        login, 
        register, 
        logout: () => signOut() 
      }}
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