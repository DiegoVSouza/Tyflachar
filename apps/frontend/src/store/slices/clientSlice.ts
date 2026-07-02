import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clientService, type ListClientsFilters } from 'services/api/clientService';
import type {
  Client,
  ClientId,
  UpdateClientInput,
  Appointment,
  LoadStatus,
} from 'types';
import type { RootState } from '../index';

interface ClientState {
  clients: Client[];
  total: number;
  selectedClientId: ClientId | null;
  clientAppointments: Appointment[];
  status: LoadStatus;
  detailsStatus: LoadStatus;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  total: 0,
  selectedClientId: null,
  clientAppointments: [],
  status: 'idle',
  detailsStatus: 'idle',
  error: null,
};

export const fetchClients = createAsyncThunk(
  'client/fetchClients',
  async (filters: ListClientsFilters = {}, { rejectWithValue }) => {
    try {
      return await clientService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchClientAppointments = createAsyncThunk(
  'client/fetchClientAppointments',
  async (id: ClientId, { rejectWithValue }) => {
    try {
      return await clientService.getAppointments(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateClientTags = createAsyncThunk(
  'client/updateTags',
  async (
    { id, data }: { id: ClientId; data: UpdateClientInput },
    { rejectWithValue }
  ) => {
    try {
      return await clientService.updateTags(id, data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    selectClient(state, action: { payload: ClientId | null }) {
      state.selectedClientId = action.payload;
      if (!action.payload) state.clientAppointments = [];
    },
    clearClientError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchClientAppointments.pending, (state) => {
        state.detailsStatus = 'loading';
      })
      .addCase(fetchClientAppointments.fulfilled, (state, action) => {
        state.detailsStatus = 'succeeded';
        state.clientAppointments = action.payload;
      })
      .addCase(fetchClientAppointments.rejected, (state, action) => {
        state.detailsStatus = 'failed';
        state.error = action.payload as string;
      });

    builder.addCase(updateClientTags.fulfilled, (state, action) => {
      const idx = state.clients.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.clients[idx] = action.payload;
    });
  },
});

export const { selectClient, clearClientError } = clientSlice.actions;

export const selectClients = (state: RootState) => state.client.clients;
export const selectTotalClients = (state: RootState) => state.client.total;
export const selectSelectedClientId = (state: RootState) => state.client.selectedClientId;
export const selectSelectedClient = (state: RootState) =>
  state.client.clients.find((c) => c.id === state.client.selectedClientId) ?? null;
export const selectClientAppointments = (state: RootState) => state.client.clientAppointments;
export const selectClientStatus = (state: RootState) => state.client.status;
export const selectClientIsLoading = (state: RootState) => state.client.status === 'loading';
export const selectClientError = (state: RootState) => state.client.error;

export default clientSlice.reducer;
