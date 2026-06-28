import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Appointment,
  AppointmentId,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentStatus,
} from 'types';

const BASE = '/appointments';

export interface ListAppointmentsFilters {
  status?: AppointmentStatus;
  period?: 'today' | 'week' | 'month';
  page?: number;
  limit?: number;
}

export const appointmentService = {
  list: (filters: ListAppointmentsFilters = {}) => {
    const url = buildUrl(BASE, filters as Record<string, string | number>);
    return apiClient.get<Appointment[]>(url);
  },

  create: (data: CreateAppointmentInput) =>
    apiClient.post<Appointment>(BASE, data),

  update: (id: AppointmentId, data: UpdateAppointmentInput) =>
    apiClient.patch<Appointment>(`${BASE}/${id}`, data),

  remove: (id: AppointmentId) =>
    apiClient.delete<void>(`${BASE}/${id}`),
};