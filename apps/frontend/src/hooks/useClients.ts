import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { ClienteId, AtualizarClienteInput } from 'types';
import {
  fetchClientes,
  fetchAgendamentosDoCliente,
  atualizarTagsCliente,
  selecionarCliente,
  selectClientes,
  selectTotalClientes,
  selectClienteSelecionado,
  selectAgendamentosDoCliente,
  selectClienteStatus,
  selectClienteIsLoading,
  selectClienteError,
} from 'store/slices/clientSlice';
import type { ListClientsFilters } from 'services/api/clientService';

export function useClients(filters: ListClientsFilters = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const clients = useSelector(selectClientes);
  const total = useSelector(selectTotalClientes);
  const selectedClient = useSelector(selectClienteSelecionado);
  const clientAppointments = useSelector(selectAgendamentosDoCliente);
  const status = useSelector(selectClienteStatus);
  const isLoading = useSelector(selectClienteIsLoading);
  const error = useSelector(selectClienteError);

  const load = useCallback(() => {
    dispatch(fetchClientes(filters));
  }, [dispatch, JSON.stringify(filters)]); // eslint-disable-line

  const openClient = useCallback(
    (id: ClienteId) => {
      dispatch(selecionarCliente(id));
      dispatch(fetchAgendamentosDoCliente(id));
    },
    [dispatch]
  );

  const closeClient = useCallback(() => {
    dispatch(selecionarCliente(null));
  }, [dispatch]);

  const updateTags = useCallback(
    (id: ClienteId, data: AtualizarClienteInput) =>
      dispatch(atualizarTagsCliente({ id, data })),
    [dispatch]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    clients,
    total,
    selectedClient,
    clientAppointments,
    status,
    isLoading,
    error,
    openClient,
    closeClient,
    updateTags,
    reload: load,
  };
}
