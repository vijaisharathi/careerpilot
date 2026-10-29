import { apiClient } from './api.client';
import {
  AuthResponseData,
  LoginCredentials,
  RegisterCredentials,
  User,
  BackendStudentProfile,
} from '../types/user.types';

const USER_KEY = 'cp_user_cache';
const PROFILE_KEY = 'cp_profile_cache';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponseData> => {
    const data = await apiClient.post<AuthResponseData>('/auth/login', credentials);
    if (data.tokens?.accessToken) {
      apiClient.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    } else if (data.token) {
      apiClient.setTokens(data.token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    if (data.profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    }
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponseData> => {
    const data = await apiClient.post<AuthResponseData>('/auth/register', credentials);
    if (data.tokens?.accessToken) {
      apiClient.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    } else if (data.token) {
      apiClient.setTokens(data.token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    if (data.profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    }
    return data;
  },

  getCurrentUser: async (): Promise<{ user: User; profile: BackendStudentProfile } | null> => {
    const token = apiClient.getAccessToken();
    if (!token) return null;

    try {
      const response = await apiClient.get<{ user: User; profile: BackendStudentProfile }>('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      if (response.profile) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(response.profile));
      }
      return response;
    } catch {
      authService.logout();
      return null;
    }
  },

  getCachedUser: (): User | null => {
    try {
      const cached = localStorage.getItem(USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  getCachedProfile: (): BackendStudentProfile | null => {
    try {
      const cached = localStorage.getItem(PROFILE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  getToken: (): string | null => {
    return apiClient.getAccessToken();
  },

  logout: async (): Promise<void> => {
    const refreshToken = apiClient.getRefreshToken();
    try {
      if (apiClient.getAccessToken()) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.clearTokens();
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem('cp_student_profile');
    }
  },
};
