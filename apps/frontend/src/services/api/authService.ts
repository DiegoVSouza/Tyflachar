import apiClient from './apiClient';
import { tokenStorage } from '../utils/tokenStorage';
import type { LoginCredentials, AuthResponse, User } from 'types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/auth/login', credentials);
    tokenStorage.setToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    tokenStorage.clearTokens();
  },

  getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },
} as const;
