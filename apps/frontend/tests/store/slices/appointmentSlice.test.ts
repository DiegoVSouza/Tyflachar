import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appointmentService } from 'services/api/appointmentService';
import type { Appointment, AppointmentId, ClientId } from 'types';
import { createTestStore } from './testStore';
import {
  clearAppointmentError,
  createAppointment,
  fetchAppointments,
  receiveNewAppointment,
  selectAppointmentError,
  selectAppointmentIsLoading,
  selectAppointmentStatus,
  selectAppointments,
  updateAppointment,
} from 'store/slices/appointmentSlice';

vi.mock('services/api/appointmentService', () => ({
  appointmentService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'a1' as AppointmentId,
    client_id: 'c1' as ClientId,
    client_name: 'Ana',
    service: 'Haircut',
    scheduled_at: '2024-01-02T14:00:00.000Z',
    status: 'pending',
    ...overrides,
  };
}

function makeStore() {
  return createTestStore();
}

describe('appointmentSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the expected initial state', () => {
    const store = makeStore();
    expect(store.getState().appointment).toEqual({
      appointments: [],
      status: 'idle',
      error: null,
    });
  });

  it('receiveNewAppointment prepends the appointment to the list', () => {
    const store = makeStore();
    const first = makeAppointment({ id: 'a1' as AppointmentId });
    const second = makeAppointment({ id: 'a2' as AppointmentId });

    store.dispatch(receiveNewAppointment(first));
    store.dispatch(receiveNewAppointment(second));

    expect(selectAppointments(store.getState()).map((a) => a.id)).toEqual(['a2', 'a1']);
  });

  it('clearAppointmentError resets the error field', () => {
    const store = makeStore();
    store.dispatch({ type: fetchAppointments.rejected.type, payload: 'boom' });
    expect(selectAppointmentError(store.getState())).toBe('boom');
    store.dispatch(clearAppointmentError());
    expect(selectAppointmentError(store.getState())).toBeNull();
  });

  describe('fetchAppointments thunk', () => {
    it('sets loading while pending and clears previous error', () => {
      const store = makeStore();
      store.dispatch({ type: fetchAppointments.pending.type });
      expect(selectAppointmentStatus(store.getState())).toBe('loading');
      expect(selectAppointmentIsLoading(store.getState())).toBe(true);
      expect(selectAppointmentError(store.getState())).toBeNull();
    });

    it('stores the appointment list on success', async () => {
      const list = [makeAppointment()];
      vi.mocked(appointmentService.list).mockResolvedValue(list);

      const store = makeStore();
      await store.dispatch(fetchAppointments({}));

      const state = store.getState();
      expect(selectAppointmentStatus(state)).toBe('succeeded');
      expect(selectAppointments(state)).toEqual(list);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(appointmentService.list).mockRejectedValue(new Error('offline'));

      const store = makeStore();
      await store.dispatch(fetchAppointments({}));

      const state = store.getState();
      expect(selectAppointmentStatus(state)).toBe('failed');
      expect(selectAppointmentError(state)).toBe('offline');
    });
  });

  describe('createAppointment thunk', () => {
    it('prepends the created appointment on success', async () => {
      const created = makeAppointment({ id: 'a9' as AppointmentId });
      vi.mocked(appointmentService.create).mockResolvedValue(created);

      const store = makeStore();
      await store.dispatch(
        createAppointment({
          client_id: created.client_id as ClientId,
          service: created.service,
          scheduled_at: created.scheduled_at,
        })
      );

      const state = store.getState();
      expect(selectAppointmentStatus(state)).toBe('succeeded');
      expect(selectAppointments(state)).toEqual([created]);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(appointmentService.create).mockRejectedValue(new Error('conflict'));

      const store = makeStore();
      await store.dispatch(
        createAppointment({ client_id: 'c1' as ClientId, service: 'Cut', scheduled_at: 'now' })
      );

      const state = store.getState();
      expect(selectAppointmentStatus(state)).toBe('failed');
      expect(selectAppointmentError(state)).toBe('conflict');
    });
  });

  describe('updateAppointment thunk', () => {
    it('replaces the matching appointment on success', async () => {
      const original = makeAppointment({ id: 'a1' as AppointmentId, status: 'pending' });
      const updated = { ...original, status: 'confirmed' as const };
      vi.mocked(appointmentService.update).mockResolvedValue(updated);

      const store = makeStore();
      store.dispatch({ type: fetchAppointments.fulfilled.type, payload: [original] });

      await store.dispatch(updateAppointment({ id: original.id, data: { status: 'confirmed' } }));

      expect(selectAppointments(store.getState())).toEqual([updated]);
    });

    it('stores the error message on failure without touching status', async () => {
      vi.mocked(appointmentService.update).mockRejectedValue(new Error('not allowed'));

      const store = makeStore();
      await store.dispatch(updateAppointment({ id: 'a1' as AppointmentId, data: { status: 'cancelled' } }));

      expect(selectAppointmentError(store.getState())).toBe('not allowed');
    });
  });
});
