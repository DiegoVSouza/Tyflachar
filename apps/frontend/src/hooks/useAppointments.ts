import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { AgendamentoId, CriarAgendamentoInput, AtualizarAgendamentoInput } from 'types';
import {
  fetchAgendamentos,
  criarAgendamento,
  atualizarAgendamento,
  selectAgendamentos,
  selectAgendamentoStatus,
  selectAgendamentoIsLoading,
  selectAgendamentoError,
} from 'store/slices/appointmentSlice';
import type { ListAppointmentsFilters } from 'services/api/appointmentService';

export function useAppointments(filters: ListAppointmentsFilters = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const appointments = useSelector(selectAgendamentos);
  const status = useSelector(selectAgendamentoStatus);
  const isLoading = useSelector(selectAgendamentoIsLoading);
  const error = useSelector(selectAgendamentoError);

  const load = useCallback(() => {
    dispatch(fetchAgendamentos(filters));
  }, [dispatch, JSON.stringify(filters)]); // eslint-disable-line

  const create = useCallback(
    (data: CriarAgendamentoInput) => dispatch(criarAgendamento(data)),
    [dispatch]
  );

  const update = useCallback(
    (id: AgendamentoId, data: AtualizarAgendamentoInput) =>
      dispatch(atualizarAgendamento({ id, data })),
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
