import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  appointmentService,
  type ListAppointmentsFilters,
} from 'services/api/appointmentService';
import type {
  Agendamento,
  AgendamentoId,
  CriarAgendamentoInput,
  AtualizarAgendamentoInput,
  LoadStatus,
} from 'types';
import type { RootState } from '../index';

interface AppointmentState {
  agendamentos: Agendamento[];
  status: LoadStatus;
  error: string | null;
}

const initialState: AppointmentState = {
  agendamentos: [],
  status: 'idle',
  error: null,
};

export const fetchAgendamentos = createAsyncThunk(
  'appointment/fetchAppointments',
  async (filters: ListAppointmentsFilters = {}, { rejectWithValue }) => {
    try {
      return await appointmentService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const criarAgendamento = createAsyncThunk(
  'appointment/create',
  async (data: CriarAgendamentoInput, { rejectWithValue }) => {
    try {
      return await appointmentService.create(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const atualizarAgendamento = createAsyncThunk(
  'appointment/update',
  async (
    { id, data }: { id: AgendamentoId; data: AtualizarAgendamentoInput },
    { rejectWithValue }
  ) => {
    try {
      return await appointmentService.update(id, data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    receberNovoAgendamento(state, action: PayloadAction<Agendamento>) {
      state.agendamentos.unshift(action.payload);
    },
    clearAppointmentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgendamentos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAgendamentos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.agendamentos = action.payload;
      })
      .addCase(fetchAgendamentos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(criarAgendamento.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.agendamentos.unshift(action.payload);
      })
      .addCase(criarAgendamento.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(atualizarAgendamento.fulfilled, (state, action) => {
        const idx = state.agendamentos.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.agendamentos[idx] = action.payload;
      })
      .addCase(atualizarAgendamento.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { receberNovoAgendamento, clearAppointmentError } = appointmentSlice.actions;

export const selectAgendamentos = (state: RootState) => state.appointment.agendamentos;
export const selectAgendamentoStatus = (state: RootState) => state.appointment.status;
export const selectAgendamentoError = (state: RootState) => state.appointment.error;
export const selectAgendamentoIsLoading = (state: RootState) =>
  state.appointment.status === 'loading';

export default appointmentSlice.reducer;
