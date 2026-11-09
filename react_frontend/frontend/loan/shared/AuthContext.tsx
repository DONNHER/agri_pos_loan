import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, type PlatformUser, type ApiError } from './api';

// ============================================
// Auth Context Types
// ============================================

interface AuthContextType {
  user: PlatformUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  loginPassword: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; handle: string; phone: string; email: string; password: string; password_confirmation: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<PlatformUser>) => Promise<void>;
  changePassword: (current: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  resendMfa: () => Promise<void>;
  offlineLogin: (email: string, pin: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Auth Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Optionally validate token with backend
          // await api.getCurrentUser();
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const handleApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void
  ): Promise<T | null> => {
    setError(null);
    try {
      const result = await apiCall();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw err;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await handleApiCall(
      () => api.login({ email, password }),
      ({ user }) => setUser(user)
    );
  }, [handleApiCall]);

  const loginPassword = useCallback(async (email: string, password: string) => {
    await handleApiCall(
      () => api.loginPassword({ email, password }),
      ({ user }) => setUser(user)
    );
  }, [handleApiCall]);

  const register = useCallback(async (data: { fullName: string; handle: string; phone: string; email: string; password: string; password_confirmation: string }) => {
    await handleApiCall(
      () => api.register(data),
      ({ user }) => setUser(user)
    );
  }, [handleApiCall]);

  const logout = useCallback(async () => {
    await handleApiCall(
      () => api.logout(),
      () => setUser(null)
    );
  }, [handleApiCall]);

  const updateProfile = useCallback(async (data: Partial<PlatformUser>) => {
    await handleApiCall(
      () => api.updateProfile(data),
      (updatedUser) => setUser(updatedUser)
    );
  }, [handleApiCall]);

  const changePassword = useCallback(async (current: string, newPassword: string) => {
    await handleApiCall(() => api.changePassword(current, newPassword));
  }, [handleApiCall]);

  const forgotPassword = useCallback(async (email: string) => {
    await handleApiCall(() => api.forgotPassword(email));
  }, [handleApiCall]);

  const resetPassword = useCallback(async (token: string, email: string, password: string, password_confirmation: string) => {
    await handleApiCall(() => api.resetPassword(token, email, password, password_confirmation));
  }, [handleApiCall]);

  const verifyMfa = useCallback(async (code: string) => {
    await handleApiCall(() => api.verifyMfa(code));
  }, [handleApiCall]);

  const resendMfa = useCallback(async () => {
    await handleApiCall(() => api.resendMfa());
  }, [handleApiCall]);

  const offlineLogin = useCallback(async (email: string, pin: string) => {
    await handleApiCall(
      () => api.offlineLogin({ email, pin }),
      ({ user }) => setUser(user)
    );
  }, [handleApiCall]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await api.getCurrentUser();
      setUser(freshUser);
    } catch {
      // Token expired, user will be redirected to login by interceptor
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    loginPassword,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyMfa,
    resendMfa,
    offlineLogin,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// Hook to use Auth Context
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// Hook for API calls with loading/error state
// ============================================

export const useApi = <T,>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, dependencies);

  return { data, isLoading, error, execute, refetch: execute };
};

// ============================================
// Hook for mutations (POST, PUT, DELETE)
// ============================================

export const useMutation = <T, Args extends unknown[]>(
  mutationFn: (...args: Args) => Promise<T>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(async (...args: Args): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutationFn(...args);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn]);

  return { mutate, isLoading, error };
};