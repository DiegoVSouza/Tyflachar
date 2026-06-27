import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchUserById,
  selectAllUsers,
  selectSelectedUser,
  selectUsersIsLoading,
  selectUsersError,
  selectUsersTotal,
  selectUser,
  clearSelectedUser,
  clearUsersError,
} from 'store/slices/usersSlice';
import type { AppDispatch } from 'store';
import type { User, CreateUserInput, UpdateUserInput } from 'types';
import type { UserFilters } from 'services/api/userService';

interface UseUsersOptions {
  autoFetch?: boolean;
}

interface UseUsersReturn {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  fetch: (customFilters?: UserFilters) => void;
  fetchById: (id: string) => void;
  create: (data: CreateUserInput) => Promise<User | null>;
  update: (id: string, data: UpdateUserInput) => Promise<User | null>;
  remove: (id: string) => Promise<boolean>;
  select: (user: User) => void;
  clearSelected: () => void;
  clearError: () => void;
}

export function useUsers(
  filters: UserFilters = {},
  { autoFetch = true }: UseUsersOptions = {}
): UseUsersReturn {
  const dispatch = useDispatch<AppDispatch>();

  const users = useSelector(selectAllUsers);
  const selectedUser = useSelector(selectSelectedUser);
  const isLoading = useSelector(selectUsersIsLoading);
  const error = useSelector(selectUsersError);
  const total = useSelector(selectUsersTotal);

  // Stable serialisation to avoid effect re-runs on each render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchUsers(JSON.parse(filtersKey) as UserFilters));
    }
    // filtersKey is a stable JSON string — safe as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, autoFetch, filtersKey]);

  const fetch = useCallback(
    (customFilters?: UserFilters) => {
      dispatch(fetchUsers(customFilters ?? (JSON.parse(filtersKey) as UserFilters)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, filtersKey]
  );

  const fetchById = useCallback(
    (id: string) => { dispatch(fetchUserById(id)); },
    [dispatch]
  );

  const create = useCallback(
    async (data: CreateUserInput): Promise<User | null> => {
      const result = await dispatch(createUser(data));
      return result.meta.requestStatus === 'fulfilled' ? (result.payload as User) : null;
    },
    [dispatch]
  );

  const update = useCallback(
    async (id: string, data: UpdateUserInput): Promise<User | null> => {
      const result = await dispatch(updateUser({ id, data }));
      return result.meta.requestStatus === 'fulfilled' ? (result.payload as User) : null;
    },
    [dispatch]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await dispatch(deleteUser(id));
      return result.meta.requestStatus === 'fulfilled';
    },
    [dispatch]
  );

  const select = useCallback(
    (user: User) => { dispatch(selectUser(user)); },
    [dispatch]
  );

  const clearSelected = useCallback(
    () => { dispatch(clearSelectedUser()); },
    [dispatch]
  );

  const clearError = useCallback(
    () => { dispatch(clearUsersError()); },
    [dispatch]
  );

  return {
    users,
    selectedUser,
    isLoading,
    error,
    total,
    fetch,
    fetchById,
    create,
    update,
    remove,
    select,
    clearSelected,
    clearError,
  };
}
