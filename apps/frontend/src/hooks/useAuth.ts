import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { AppDispatch } from 'store';
import {
  login as loginAction,
  logout as logoutAction,
  fetchCurrentUser,
  clearAuthError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthIsLoading,
  selectAuthError,
} from 'store/slices/authSlice';
import type { User, LoginCredentials } from 'types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthIsLoading);
  const error = useSelector(selectAuthError);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      const result = await dispatch(loginAction(credentials));
      return result.meta.requestStatus === 'fulfilled';
    },
    [dispatch]
  );

  const logout = useCallback(async (): Promise<void> => {
    await dispatch(logoutAction());
  }, [dispatch]);

  const refreshUser = useCallback(async (): Promise<void> => {
    await dispatch(fetchCurrentUser());
  }, [dispatch]);

  const clearError = useCallback((): void => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return { user, isAuthenticated, isLoading, error, login, logout, refreshUser, clearError };
}
