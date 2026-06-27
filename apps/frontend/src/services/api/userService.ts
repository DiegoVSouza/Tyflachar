import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type { User, CreateUserInput, UpdateUserInput, PaginatedUsers } from 'types';

const BASE = '/users';

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
}

export const userService = {
  list(filters: UserFilters = {}): Promise<PaginatedUsers> {
    return apiClient.get<PaginatedUsers>(buildUrl(BASE, filters as Record<string, unknown>));
  },

  getById(id: string): Promise<User> {
    return apiClient.get<User>(`${BASE}/${id}`);
  },

  create(data: CreateUserInput): Promise<User> {
    return apiClient.post<User>(BASE, data);
  },

  update(id: string, data: UpdateUserInput): Promise<User> {
    return apiClient.patch<User>(`${BASE}/${id}`, data);
  },

  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },
} as const;
