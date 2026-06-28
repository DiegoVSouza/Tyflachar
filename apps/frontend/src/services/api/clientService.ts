import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Client,
  ClientId,
  UpdateClientInput,
  PaginatedResponse,
  Appointment,
} from 'types';

const BASE = '/clients';

export interface ListClientsFilters {
  q?: string;
  page?: number;
  limit?: number;
}

export const clientService = {
  list: (filters: ListClientsFilters = {}) => {
    const url = buildUrl(BASE, filters as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Client>>(url);
  },

  getById: (id: ClientId) =>
    apiClient.get<Client>(`${BASE}/${id}`),

  getAppointments: (id: ClientId) =>
    apiClient.get<Appointment[]>(`${BASE}/${id}/appointments`),

  updateTags: (id: ClientId, data: UpdateClientInput) =>
    apiClient.patch<Client>(`${BASE}/${id}/tags`, data),
};