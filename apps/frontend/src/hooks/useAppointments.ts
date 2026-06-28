import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { AppointmentId, CreateAppointmentInput, UpdateAppointmentInput } from 'types';
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  selectAppointments,
  selectAppointmentStatus,
  selectAppointmentIsLoading,
  selectAppointmentError,
} from 'store/slices/appointmentSlice';
import type { ListAppointmentsFilters } from 'services/api/appointmentService';

export function useAppointments(filters: ListAppointmentsFilters = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const appointments = useSelector(selectAppointments);
  const status = useSelector(selectAppointmentStatus);
  const isLoading = useSelector(selectAppointmentIsLoading);
  const error = useSelector(selectAppointmentError);

  const load = useCallback(() => {
    dispatch(fetchAppointments(filters));
  }, [dispatch, JSON.stringify(filters)]); // eslint-disable-line

  const create = useCallback(
    (data: CreateAppointmentInput) => dispatch(createAppointment(data)),
    [dispatch]
  );

  const update = useCallback(
    (id: AppointmentId, data: UpdateAppointmentInput) =>
      dispatch(updateAppointment({ id, data })),
    [dispatch]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    appointments,
    status,
    isLoading,
    error,
    create,
    update,
    reload: load,
  };
}