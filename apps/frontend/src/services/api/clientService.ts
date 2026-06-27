import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Cliente,
  ClienteId,
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

  getById: (id: ClienteId) =>
    apiClient.get<Cliente>(`${BASE}/${id}`),

  getAppointments: (id: ClienteId) =>
    apiClient.get<Agendamento[]>(`${BASE}/${id}/appointments`),

  update: (id: ClienteId, data: AtualizarClienteInput) =>
    apiClient.patch<Cliente>(`${BASE}/${id}/tags`, data),
};
