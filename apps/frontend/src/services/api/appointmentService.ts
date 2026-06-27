import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Agendamento,
  AgendamentoId,
  CriarAgendamentoInput,
  AtualizarAgendamentoInput,
  AgendamentoStatus,
} from 'types';

const BASE = '/appointments';

export interface ListAppointmentsFilters {
  status?: AgendamentoStatus;
  period?: 'hoje' | 'semana' | 'mes';
  page?: number;
  limit?: number;
}

export const appointmentService = {
  list: (filters: ListAppointmentsFilters = {}) => {
    const url = buildUrl(BASE, filters as Record<string, string | number>);
    return apiClient.get<Agendamento[]>(url);
  },

  create: (data: CriarAgendamentoInput) =>
    apiClient.post<Agendamento>(BASE, data),

  update: (id: AgendamentoId, data: AtualizarAgendamentoInput) =>
    apiClient.patch<Agendamento>(`${BASE}/${id}`, data),

  remove: (id: AgendamentoId) =>
    apiClient.delete<void>(`${BASE}/${id}`),
};
