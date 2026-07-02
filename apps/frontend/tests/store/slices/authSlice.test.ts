import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from 'services/api/authService';
import { tokenStorage } from 'services/utils/tokenStorage';
import type { AuthResponse, User } from 'types';
import { createTestStore } from './testStore';
import {
  clearAuthError,
  fetchCurrentUser,
  login,
  logout,
  selectAuthError,
  selectAuthIsLoading,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
} from 'store/slices/authSlice';

vi.mock('services/api/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-1' as User['id'],
  name: 'Ana',
  email: 'ana@example.com',
  role: 'admin',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function makeStore() {
  return createTestStore();
}

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('has the expected initial state when there is no persisted token', () => {
    const store = makeStore();
    const state = store.getState().auth;

    expect(state).toEqual({
      user: null,
      isAuthenticated: false,
      status: 'idle',
      error: null,
    });
  });

  it('derives isAuthenticated from a persisted token at slice creation time', () => {
    tokenStorage.setToken('persisted-jwt');
    // Re-import a fresh instance of the module so initialState re-reads tokenStorage.
    vi.resetModules();
    return import('store/slices/authSlice').then(({ default: freshAuthReducer }) => {
      const store = configureStore({ reducer: { auth: freshAuthReducer } });
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
  });

  it('clearAuthError resets the error field', () => {
    const store = makeStore();
    store.dispatch({ type: 'auth/login/rejected', payload: 'boom' });
    expect(store.getState().auth.error).toBe('boom');

    store.dispatch(clearAuthError());
    expect(store.getState().auth.error).toBeNull();
  });

  describe('login thunk', () => {
    it('sets status to loading while pending', () => {
      const store = makeStore();
      store.dispatch({ type: login.pending.type });

      expect(selectAuthStatus(store.getState())).toBe('loading');
      expect(selectAuthIsLoading(store.getState())).toBe(true);
      expect(selectAuthError(store.getState())).toBeNull();
    });

    it('stores the user and marks authenticated on success', async () => {
      const response: AuthResponse = { user: mockUser, token: 'jwt-token' };
      vi.mocked(authService.login).mockResolvedValue(response);

      const store = makeStore();
      await store.dispatch(login({ email: mockUser.email, password: 'secret' }));

      const state = store.getState();
      expect(selectAuthStatus(state)).toBe('succeeded');
      expect(selectCurrentUser(state)).toEqual(mockUser);
      expect(selectIsAuthenticated(state)).toBe(true);
    });

    it('stores the error and clears authentication on failure', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      const store = makeStore();
      await store.dispatch(login({ email: 'x@x.com', password: 'wrong' }));

      const state = store.getState();
      expect(selectAuthStatus(state)).toBe('failed');
      expect(selectAuthError(state)).toBe('Invalid credentials');
      expect(selectIsAuthenticated(state)).toBe(false);
    });
  });

  describe('logout thunk', () => {
    it('clears user and authentication state on success', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const store = makeStore();
      store.dispatch({ type: login.fulfilled.type, payload: { user: mockUser, token: 't' } });
      expect(selectIsAuthenticated(store.getState())).toBe(true);

      await store.dispatch(logout());

      const state = store.getState();
      expect(selectCurrentUser(state)).toBeNull();
      expect(selectIsAuthenticated(state)).toBe(false);
      expect(selectAuthStatus(state)).toBe('idle');
    });
  });

  describe('fetchCurrentUser thunk', () => {
    it('sets status to loading while pending', () => {
      const store = makeStore();
      store.dispatch({ type: fetchCurrentUser.pending.type });
      expect(selectAuthStatus(store.getState())).toBe('loading');
    });

    it('stores the user and marks authenticated on success', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(mockUser);

      const store = makeStore();
      await store.dispatch(fetchCurrentUser());

      const state = store.getState();
      expect(selectAuthStatus(state)).toBe('succeeded');
      expect(selectCurrentUser(state)).toEqual(mockUser);
      expect(selectIsAuthenticated(state)).toBe(true);
    });

    it('clears the user and authentication on failure', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));

      const store = makeStore();
      await store.dispatch(fetchCurrentUser());

      const state = store.getState();
      expect(selectAuthStatus(state)).toBe('failed');
      expect(selectCurrentUser(state)).toBeNull();
      expect(selectIsAuthenticated(state)).toBe(false);
    });
  });
});
