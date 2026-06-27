import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService, UserFilters } from 'services/api/userService';
import type { User, CreateUserInput, UpdateUserInput, LoadStatus } from 'types';
import type { RootState } from '../index';

// ─── State ────────────────────────────────────────────────────────────────────

interface UsersState {
  items: User[];
  selectedUser: User | null;
  total: number;
  status: LoadStatus;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  selectedUser: null,
  total: 0,
  status: 'idle',
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (filters: UserFilters | undefined, { rejectWithValue }) => {
    try {
      return await userService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await userService.getById(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (data: CreateUserInput, { rejectWithValue }) => {
    try {
      return await userService.create(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: UpdateUserInput }, { rejectWithValue }) => {
    try {
      return await userService.update(id, data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await userService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    selectUser(state, action: PayloadAction<User>) {
      state.selectedUser = action.payload;
    },
    clearSelectedUser(state) {
      state.selectedUser = null;
    },
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // fetchUserById
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // createUser
    builder
      .addCase(createUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
        state.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // updateUser
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // deleteUser
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter((u) => u.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

// ─── Actions ─────────────────────────────────────────────────────────────────

export const { selectUser, clearSelectedUser, clearUsersError } = usersSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectAllUsers = (state: RootState): User[] => state.users.items;
export const selectSelectedUser = (state: RootState): User | null => state.users.selectedUser;
export const selectUsersTotal = (state: RootState): number => state.users.total;
export const selectUsersStatus = (state: RootState): LoadStatus => state.users.status;
export const selectUsersError = (state: RootState): string | null => state.users.error;
export const selectUsersIsLoading = (state: RootState): boolean =>
  state.users.status === 'loading';

export default usersSlice.reducer;
