import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, UserStatus } from '../types/api';
import {
  login as apiLogin,
  getMe,
  getUserStatus,
  getStoredToken,
  clearStoredToken,
} from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  loginUser: (registrationNo: string, password?: string) => Promise<void>;
  loginWithToken: (newToken: string) => Promise<void>;
  logout: () => void;
  userStatus: UserStatus | null;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch live session status for the authenticated user
  const refreshUserStatus = useCallback(async () => {
    if (!user?.id) {
      setUserStatus(null);
      return;
    }
    try {
      const status = await getUserStatus(user.id);
      setUserStatus(status);
    } catch (err) {
      console.warn('Failed to fetch user attendance status:', err);
    }
  }, [user?.id]);

  // Validate stored token and load profile on startup
  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredToken();
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const me = await getMe();
        setUser(me);
        setToken(stored);
      } catch (err) {
        console.warn('Stored token expired or invalid:', err);
        clearStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Whenever user changes, update their active attendance status
  useEffect(() => {
    if (user?.id) {
      refreshUserStatus();
    } else {
      setUserStatus(null);
    }
  }, [user?.id, refreshUserStatus]);

  const loginUser = useCallback(async (registrationNo: string, password?: string) => {
    const res = await apiLogin(registrationNo, password);
    setUser(res.user);
    setToken(res.token);
  }, []);

  const loginWithToken = useCallback(async (newToken: string) => {
    setToken(newToken);
    const me = await getMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setToken(null);
    setUserStatus(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    loading,
    loginUser,
    loginWithToken,
    logout,
    userStatus,
    refreshUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
