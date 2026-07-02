import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userService } from 'services/api/userService';
import type { PaginatedUsers, User } from 'types';
import { createTestStore } from './testStore';
import {
  clearSelectedUser,
  clearUsersError,
  createUser,
  deleteUser,
  fetchUserById,
  fetchUsers,
  selectAllUsers,
  selectSelectedUser,
  selectUser,
  selectUsersError,
  selectUsersIsLoading,
  selectUsersStatus,
  selectUsersTotal,
  updateUser,
} from 'store/slices/usersSlice';

vi.mock('services/api/userService', () => ({
  userService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1' as User['id'],
    name: 'Bea',
    email: 'bea@example.com',
    role: 'user',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeStore() {
  return createTestStore();
}

describe('usersSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the expected initial state', () => {
    const store = makeStore();
    expect(store.getState().users).toEqual({
      items: [],
      selectedUser: null,
      total: 0,
      status: 'idle',
      error: null,
    });
  });

  it('selectUser stores the selected user', () => {
    const store = makeStore();
    const user = makeUser();
    store.dispatch(selectUser(user));
    expect(selectSelectedUser(store.getState())).toEqual(user);
  });

  it('clearSelectedUser resets the selection', () => {
    const store = makeStore();
    store.dispatch(selectUser(makeUser()));
    store.dispatch(clearSelectedUser());
    expect(selectSelectedUser(store.getState())).toBeNull();
  });

  it('clearUsersError resets the error field', () => {
    const store = makeStore();
    store.dispatch({ type: fetchUsers.rejected.type, payload: 'failed' });
    expect(selectUsersError(store.getState())).toBe('failed');
    store.dispatch(clearUsersError());
    expect(selectUsersError(store.getState())).toBeNull();
  });

  describe('fetchUsers thunk', () => {
    it('sets loading while pending and clears previous error', () => {
      const store = makeStore();
      store.dispatch({ type: fetchUsers.pending.type });
      expect(selectUsersStatus(store.getState())).toBe('loading');
      expect(selectUsersIsLoading(store.getState())).toBe(true);
      expect(selectUsersError(store.getState())).toBeNull();
    });

    it('stores items and total on success', async () => {
      const payload: PaginatedUsers = { items: [makeUser()], total: 1, page: 1, pageSize: 20 };
      vi.mocked(userService.list).mockResolvedValue(payload);

      const store = makeStore();
      await store.dispatch(fetchUsers(undefined));

      const state = store.getState();
      expect(selectUsersStatus(state)).toBe('succeeded');
      expect(selectAllUsers(state)).toEqual(payload.items);
      expect(selectUsersTotal(state)).toBe(1);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(userService.list).mockRejectedValue(new Error('network down'));

      const store = makeStore();
      await store.dispatch(fetchUsers(undefined));

      const state = store.getState();
      expect(selectUsersStatus(state)).toBe('failed');
      expect(selectUsersError(state)).toBe('network down');
    });
  });

  describe('fetchUserById thunk', () => {
    it('stores the fetched user as selectedUser on success', async () => {
      const user = makeUser({ id: 'u2' as User['id'] });
      vi.mocked(userService.getById).mockResolvedValue(user);

      const store = makeStore();
      await store.dispatch(fetchUserById('u2'));

      expect(selectSelectedUser(store.getState())).toEqual(user);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(userService.getById).mockRejectedValue(new Error('not found'));

      const store = makeStore();
      await store.dispatch(fetchUserById('missing'));

      expect(selectUsersError(store.getState())).toBe('not found');
    });
  });

  describe('createUser thunk', () => {
    it('appends the new user and increments total on success', async () => {
      const user = makeUser({ id: 'u3' as User['id'] });
      vi.mocked(userService.create).mockResolvedValue(user);

      const store = makeStore();
      await store.dispatch(
        createUser({ name: user.name, email: user.email, password: 'secret' })
      );

      const state = store.getState();
      expect(selectAllUsers(state)).toEqual([user]);
      expect(selectUsersTotal(state)).toBe(1);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(userService.create).mockRejectedValue(new Error('duplicate email'));

      const store = makeStore();
      await store.dispatch(
        createUser({ name: 'X', email: 'x@x.com', password: 'secret' })
      );

      expect(selectUsersError(store.getState())).toBe('duplicate email');
    });
  });

  describe('updateUser thunk', () => {
    it('replaces the matching item and selectedUser on success', async () => {
      const original = makeUser({ id: 'u4' as User['id'], name: 'Old name' });
      const updated = { ...original, name: 'New name' };
      vi.mocked(userService.update).mockResolvedValue(updated);

      const store = makeStore();
      store.dispatch({ type: fetchUsers.fulfilled.type, payload: { items: [original], total: 1 } });
      store.dispatch(selectUser(original));

      await store.dispatch(updateUser({ id: original.id, data: { name: 'New name' } }));

      const state = store.getState();
      expect(selectAllUsers(state)).toEqual([updated]);
      expect(selectSelectedUser(state)).toEqual(updated);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(userService.update).mockRejectedValue(new Error('forbidden'));

      const store = makeStore();
      await store.dispatch(updateUser({ id: 'u5', data: { active: false } }));

      expect(selectUsersError(store.getState())).toBe('forbidden');
    });
  });

  describe('deleteUser thunk', () => {
    it('removes the user, decrements total and clears selection if it matched', async () => {
      const user = makeUser({ id: 'u6' as User['id'] });
      vi.mocked(userService.remove).mockResolvedValue(undefined);

      const store = makeStore();
      store.dispatch({ type: fetchUsers.fulfilled.type, payload: { items: [user], total: 1 } });
      store.dispatch(selectUser(user));

      await store.dispatch(deleteUser(user.id));

      const state = store.getState();
      expect(selectAllUsers(state)).toEqual([]);
      expect(selectUsersTotal(state)).toBe(0);
      expect(selectSelectedUser(state)).toBeNull();
    });

    it('never lets total go below zero', async () => {
      vi.mocked(userService.remove).mockResolvedValue(undefined);

      const store = makeStore();
      await store.dispatch(deleteUser('non-existent'));

      expect(selectUsersTotal(store.getState())).toBe(0);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(userService.remove).mockRejectedValue(new Error('cannot delete'));

      const store = makeStore();
      await store.dispatch(deleteUser('u7'));

      expect(selectUsersError(store.getState())).toBe('cannot delete');
    });
  });
});
