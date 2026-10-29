import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, BackendStudentProfile, LoginCredentials, RegisterCredentials } from '../types/user.types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  profile: BackendStudentProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCachedUser());
  const [profile, setProfile] = useState<BackendStudentProfile | null>(() =>
    authService.getCachedProfile()
  );
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCurrentUser = async () => {
    const activeToken = authService.getToken();
    if (!activeToken) {
      setUser(null);
      setProfile(null);
      setToken(null);
      return;
    }

    try {
      const data = await authService.getCurrentUser();
      if (data) {
        setUser(data.user);
        setProfile(data.profile);
        setToken(activeToken);
      } else {
        setUser(null);
        setProfile(null);
        setToken(null);
      }
    } catch {
      await authService.logout();
      setUser(null);
      setProfile(null);
      setToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshCurrentUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    setProfile(result.profile);
    setToken(result.tokens?.accessToken || result.token);
  };

  const register = async (credentials: RegisterCredentials) => {
    const result = await authService.register(credentials);
    setUser(result.user);
    setProfile(result.profile);
    setToken(result.tokens?.accessToken || result.token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: Boolean(token && user),
        isAdmin: Boolean(user?.role === 'admin'),
        isLoading,
        login,
        register,
        logout,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
