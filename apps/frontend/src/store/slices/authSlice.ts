import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from 'services/api/authService';
import { tokenStorage } from 'services/utils/tokenStorage';
import type { User, LoginCredentials, LoadStatus } from 'types';
import type { RootState } from '../index';

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: LoadStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: tokenStorage.hasToken(),
  status: 'idle',
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const logout = createAsyncThunk<void, void>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
    });

    // fetchCurrentUser
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = 'failed';
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

// ─── Actions ─────────────────────────────────────────────────────────────────

export const { clearAuthError } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCurrentUser = (state: RootState): User | null => state.auth.user;
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.isAuthenticated;
export const selectAuthStatus = (state: RootState): LoadStatus => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectAuthIsLoading = (state: RootState): boolean => state.auth.status === 'loading';

export default authSlice.reducer;
