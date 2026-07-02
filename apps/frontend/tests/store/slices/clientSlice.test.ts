import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientService } from 'services/api/clientService';
import type { Appointment, AppointmentId, Client, ClientId, PaginatedResponse } from 'types';
import { createTestStore } from './testStore';
import {
  clearClientError,
  fetchClientAppointments,
  fetchClients,
  selectClient,
  selectClientAppointments,
  selectClientError,
  selectClientIsLoading,
  selectClientStatus,
  selectClients,
  selectSelectedClient,
  selectSelectedClientId,
  selectTotalClients,
  updateClientTags,
} from 'store/slices/clientSlice';

vi.mock('services/api/clientService', () => ({
  clientService: {
    list: vi.fn(),
    getById: vi.fn(),
    getAppointments: vi.fn(),
    updateTags: vi.fn(),
  },
}));

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'cl1' as ClientId,
    name: 'Ana',
    phone: '+5511999999999',
    tags: [],
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'a1' as AppointmentId,
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

describe('clientSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the expected initial state', () => {
    const store = makeStore();
    expect(store.getState().client).toEqual({
      clients: [],
      total: 0,
      selectedClientId: null,
      clientAppointments: [],
      status: 'idle',
      detailsStatus: 'idle',
      error: null,
    });
  });

  describe('selectClient', () => {
    it('stores the selected client id', () => {
      const store = makeStore();
      store.dispatch(selectClient('cl1' as ClientId));
      expect(selectSelectedClientId(store.getState())).toBe('cl1');
    });

    it('clears clientAppointments when deselecting (null)', () => {
      const store = makeStore();
      store.dispatch({
        type: fetchClientAppointments.fulfilled.type,
        payload: [makeAppointment()],
      });
      expect(selectClientAppointments(store.getState())).toHaveLength(1);

      store.dispatch(selectClient(null));

      expect(selectSelectedClientId(store.getState())).toBeNull();
      expect(selectClientAppointments(store.getState())).toEqual([]);
    });
  });

  it('clearClientError resets the error field', () => {
    const store = makeStore();
    store.dispatch({ type: fetchClients.rejected.type, payload: 'boom' });
    expect(selectClientError(store.getState())).toBe('boom');
    store.dispatch(clearClientError());
    expect(selectClientError(store.getState())).toBeNull();
  });

  describe('fetchClients thunk', () => {
    it('sets loading while pending and clears previous error', () => {
      const store = makeStore();
      store.dispatch({ type: fetchClients.pending.type });
      expect(selectClientStatus(store.getState())).toBe('loading');
      expect(selectClientIsLoading(store.getState())).toBe(true);
      expect(selectClientError(store.getState())).toBeNull();
    });

    it('stores clients and total on success', async () => {
      const payload: PaginatedResponse<Client> = { items: [makeClient()], total: 1 };
      vi.mocked(clientService.list).mockResolvedValue(payload);

      const store = makeStore();
      await store.dispatch(fetchClients({}));

      const state = store.getState();
      expect(selectClientStatus(state)).toBe('succeeded');
      expect(selectClients(state)).toEqual(payload.items);
      expect(selectTotalClients(state)).toBe(1);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(clientService.list).mockRejectedValue(new Error('offline'));

      const store = makeStore();
      await store.dispatch(fetchClients({}));

      expect(selectClientError(store.getState())).toBe('offline');
      expect(selectClientStatus(store.getState())).toBe('failed');
    });
  });

  describe('fetchClientAppointments thunk', () => {
    it('sets detailsStatus to loading while pending', () => {
      const store = makeStore();
      store.dispatch({ type: fetchClientAppointments.pending.type });
      expect(store.getState().client.detailsStatus).toBe('loading');
    });

    it('stores the client appointments on success', async () => {
      const appointments = [makeAppointment()];
      vi.mocked(clientService.getAppointments).mockResolvedValue(appointments);

      const store = makeStore();
      await store.dispatch(fetchClientAppointments('cl1' as ClientId));

      const state = store.getState();
      expect(state.client.detailsStatus).toBe('succeeded');
      expect(selectClientAppointments(state)).toEqual(appointments);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(clientService.getAppointments).mockRejectedValue(new Error('not found'));

      const store = makeStore();
      await store.dispatch(fetchClientAppointments('missing' as ClientId));

      const state = store.getState();
      expect(state.client.detailsStatus).toBe('failed');
      expect(selectClientError(state)).toBe('not found');
    });
  });

  describe('updateClientTags thunk', () => {
    it('replaces the matching client in the list on success', async () => {
      const original = makeClient({ id: 'cl1' as ClientId, tags: [] });
      const updated = { ...original, tags: ['vip'] };
      vi.mocked(clientService.updateTags).mockResolvedValue(updated);

      const store = makeStore();
      store.dispatch({ type: fetchClients.fulfilled.type, payload: { items: [original], total: 1 } });

      await store.dispatch(updateClientTags({ id: original.id, data: { tags: ['vip'] } }));

      expect(selectClients(store.getState())).toEqual([updated]);
    });

    it('leaves the list untouched when the client is not found (no error thrown)', async () => {
      const updated = makeClient({ id: 'unknown' as ClientId, tags: ['vip'] });
      vi.mocked(clientService.updateTags).mockResolvedValue(updated);

      const store = makeStore();
      await store.dispatch(updateClientTags({ id: 'unknown' as ClientId, data: { tags: ['vip'] } }));

      expect(selectClients(store.getState())).toEqual([]);
    });
  });

  it('selectSelectedClient derives the full client object from selectedClientId', () => {
    const client = makeClient({ id: 'cl1' as ClientId });
    const store = makeStore();
    store.dispatch({ type: fetchClients.fulfilled.type, payload: { items: [client], total: 1 } });
    store.dispatch(selectClient(client.id));

    expect(selectSelectedClient(store.getState())).toEqual(client);
  });
});
