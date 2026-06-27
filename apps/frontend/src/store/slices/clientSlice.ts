import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clientService, type ListClientsFilters } from 'services/api/clientService';
import type {
  Cliente,
  ClienteId,
  AtualizarClienteInput,
  Agendamento,
  LoadStatus,
} from 'types';
import type { RootState } from '../index';

interface ClientState {
  clientes: Cliente[];
  total: number;
  clienteSelecionadoId: ClienteId | null;
  agendamentosDoCliente: Agendamento[];
  status: LoadStatus;
  detalhesStatus: LoadStatus;
  error: string | null;
}

const initialState: ClientState = {
  clientes: [],
  total: 0,
  clienteSelecionadoId: null,
  agendamentosDoCliente: [],
  status: 'idle',
  detalhesStatus: 'idle',
  error: null,
};

export const fetchClientes = createAsyncThunk(
  'client/fetchClients',
  async (filters: ListClientsFilters = {}, { rejectWithValue }) => {
    try {
      return await clientService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchAgendamentosDoCliente = createAsyncThunk(
  'client/fetchClientAppointments',
  async (id: ClienteId, { rejectWithValue }) => {
    try {
      return await clientService.getAppointments(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const atualizarTagsCliente = createAsyncThunk(
  'client/updateTags',
  async (
    { id, data }: { id: ClienteId; data: AtualizarClienteInput },
    { rejectWithValue }
  ) => {
    try {
      return await clientService.update(id, data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    selecionarCliente(state, action: { payload: ClienteId | null }) {
      state.clienteSelecionadoId = action.payload;
      if (!action.payload) state.agendamentosDoCliente = [];
    },
    clearClientError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchClientes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clientes = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchClientes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchAgendamentosDoCliente.pending, (state) => {
        state.detalhesStatus = 'loading';
      })
      .addCase(fetchAgendamentosDoCliente.fulfilled, (state, action) => {
        state.detalhesStatus = 'succeeded';
        state.agendamentosDoCliente = action.payload;
      })
      .addCase(fetchAgendamentosDoCliente.rejected, (state, action) => {
        state.detalhesStatus = 'failed';
        state.error = action.payload as string;
      });

    builder.addCase(atualizarTagsCliente.fulfilled, (state, action) => {
      const idx = state.clientes.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.clientes[idx] = action.payload;
    });
  },
});

export const { selecionarCliente, clearClientError } = clientSlice.actions;

export const selectClientes = (state: RootState) => state.client.clientes;
export const selectTotalClientes = (state: RootState) => state.client.total;
export const selectClienteSelecionadoId = (state: RootState) => state.client.clienteSelecionadoId;
export const selectClienteSelecionado = (state: RootState) =>
  state.client.clientes.find((c) => c.id === state.client.clienteSelecionadoId) ?? null;
export const selectAgendamentosDoCliente = (state: RootState) =>
  state.client.agendamentosDoCliente;
export const selectClienteStatus = (state: RootState) => state.client.status;
export const selectClienteIsLoading = (state: RootState) => state.client.status === 'loading';
export const selectClienteError = (state: RootState) => state.client.error;

export default clientSlice.reducer;
