import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from 'services/api/authService';
import { createTestStore } from '../store/slices/testStore';
import type { AuthResponse, User } from 'types';
import { useAuth } from 'hooks/useAuth';

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

function renderUseAuth() {
  const store = createTestStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const view = renderHook(() => useAuth(), { wrapper });
  return { ...view, store };
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts unauthenticated with no user', () => {
    const { result } = renderUseAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('login() resolves true and exposes the user on success', async () => {
    const response: AuthResponse = { user: mockUser, token: 'jwt' };
    vi.mocked(authService.login).mockResolvedValue(response);

    const { result } = renderUseAuth();

    let success = false;
    await act(async () => {
      success = await result.current.login({ email: mockUser.email, password: 'secret' });
    });

    expect(success).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login() resolves false and exposes the error on failure', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderUseAuth();

    let success = true;
    await act(async () => {
      success = await result.current.login({ email: 'x@x.com', password: 'wrong' });
    });

    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('logout() clears the authenticated user', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: mockUser, token: 'jwt' });
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const { result } = renderUseAuth();

    await act(async () => {
      await result.current.login({ email: mockUser.email, password: 'secret' });
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('refreshUser() loads the current user from the API', async () => {
    vi.mocked(authService.getMe).mockResolvedValue(mockUser);

    const { result } = renderUseAuth();

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clearError() resets a stored error', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('boom'));

    const { result } = renderUseAuth();

    await act(async () => {
      await result.current.login({ email: 'x@x.com', password: 'y' });
    });
    expect(result.current.error).toBe('boom');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
