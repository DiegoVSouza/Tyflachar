import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Cliente,
  client_id,
  AtualizarClienteInput,
  PaginatedResponse,
  Agendamento,
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
    return apiClient.get<PaginatedResponse<Cliente>>(url);
  },

  getById: (id: client_id) =>
    apiClient.get<Cliente>(`${BASE}/${id}`),

  getAppointments: (id: client_id) =>
    apiClient.get<Agendamento[]>(`${BASE}/${id}/appointments`),

  update: (id: client_id, data: AtualizarClienteInput) =>
    apiClient.patch<Cliente>(`${BASE}/${id}/tags`, data),
};
