'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  logoURL?: string;
  mobileNumber?: string;
  role: 'Admin' | 'Operator' | 'Scorer' | 'Player' | 'Audience';
  status: 'Active' | 'PendingApproval' | 'Suspended';
  assignedTournaments?: string[];
  plan?: 'Free' | 'Standard' | 'Offer';
}

/**
 * Decode a JWT payload client-side WITHOUT a network call.
 * JWTs are base64url-encoded JSON — we only use this for an
 * immediate optimistic render. The real server verification
 * still runs in the background to pull fresh user fields.
 * Returns null when the token is malformed OR already expired.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    // Treat expired tokens as invalid
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, mobileNumber?: string) => Promise<{ user?: User; token?: string | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage.
  // Two-phase: decode the JWT locally for an instant optimistic user (so
  // ProtectedRoute never shows a full-page spinner on navigation), then
  // silently verify with the server in the background to pick up fresh user
  // fields and confirm the token hasn't been revoked.
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // Phase 1 — optimistic: decode locally, no network needed.
    const payload = decodeJwtPayload(storedToken);
    if (payload) {
      // Token is structurally valid and not expired — show the user immediately.
      setToken(storedToken);
      setUser({
        id:                   String(payload.userId ?? ''),
        username:             String(payload.username ?? ''),
        email:                String(payload.email ?? ''),
        role:                 payload.role as User['role'],
        status:               'Active',
        plan:                 payload.plan as User['plan'] | undefined,
        assignedTournaments:  Array.isArray(payload.assignedTournaments) ? payload.assignedTournaments : [],
      });
      setIsLoading(false); // unblock the UI immediately

      // Phase 2 — background: verify with server to get fresh fields (logoURL,
      // status, assignedTournaments). Only log out on a definitive 401/403,
      // NOT on network errors or 5xx so a transient DB cold-start never logs
      // the user out.
      verifyToken(storedToken, { logoutOnNetworkError: false });
    } else {
      // Token is malformed or expired — clean up and go to login.
      localStorage.removeItem('auth_token');
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string, opts?: { logoutOnNetworkError?: boolean }) => {
    const logoutOnNetworkError = opts?.logoutOnNetworkError ?? true;
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToVerify}`,
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      if (response.ok) {
        const data = await response.json();
        // Merge fresh server fields (logoURL, status, etc.) into state
        setUser(data.user);
        setToken(tokenToVerify);
      } else if (response.status === 401 || response.status === 403) {
        // Definitive rejection — token revoked or user suspended
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
      // 404 / 5xx: keep the optimistic user in place; don't log out
    } catch (err) {
      console.error('Token verification error:', err);
      if (logoutOnNetworkError) {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
      // else: network error during background check — leave user logged in
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    mobileNumber?: string,
  ): Promise<{ user?: User; token?: string | null }> => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, mobileNumber: mobileNumber?.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // If auto-approved, store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }

      return { user: data.user, token: data.token ?? null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during signup';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear HttpOnly cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout API error:', err);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setError(null);
      // Ensure consistent redirect no matter where logout is triggered from
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  };

  const refreshSession = async () => {
    if (token) {
      await verifyToken(token);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    refreshSession,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
