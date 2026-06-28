import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  appointmentService,
  type ListAppointmentsFilters,
} from 'services/api/appointmentService';
import type {
  Appointment,
  AppointmentId,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  LoadStatus,
} from 'types';
import type { RootState } from '../index';

interface AppointmentState {
  appointments: Appointment[];
  status: LoadStatus;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  status: 'idle',
  error: null,
};

export const fetchAppointments = createAsyncThunk(
  'appointment/fetchAppointments',
  async (filters: ListAppointmentsFilters = {}, { rejectWithValue }) => {
    try {
      return await appointmentService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointment/create',
  async (data: CreateAppointmentInput, { rejectWithValue }) => {
    try {
      return await appointmentService.create(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateAppointment = createAsyncThunk(
  'appointment/update',
  async (
    { id, data }: { id: AppointmentId; data: UpdateAppointmentInput },
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
    receiveNewAppointment(state, action: PayloadAction<Appointment>) {
      state.appointments.unshift(action.payload);
    },
    clearAppointmentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appointments.unshift(action.payload);
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const idx = state.appointments.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.appointments[idx] = action.payload;
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { receiveNewAppointment, clearAppointmentError } = appointmentSlice.actions;

export const selectAppointments = (state: RootState) => state.appointment.appointments;
export const selectAppointmentStatus = (state: RootState) => state.appointment.status;
export const selectAppointmentError = (state: RootState) => state.appointment.error;
export const selectAppointmentIsLoading = (state: RootState) =>
  state.appointment.status === 'loading';

export default appointmentSlice.reducer;
