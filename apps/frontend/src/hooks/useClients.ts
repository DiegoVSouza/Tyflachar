import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { ClientId, UpdateClientInput } from 'types';
import {
  fetchClients,
  fetchClientAppointments,
  updateClientTags,
  selectClient,
  selectClients,
  selectTotalClients,
  selectSelectedClient,
  selectClientAppointments,
  selectClientStatus,
  selectClientIsLoading,
  selectClientError,
} from 'store/slices/clientSlice';
import type { ListClientsFilters } from 'services/api/clientService';

export function useClients(filters: ListClientsFilters = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const clients = useSelector(selectClients);
  const total = useSelector(selectTotalClients);
  const selectedClient = useSelector(selectSelectedClient);
  const clientAppointments = useSelector(selectClientAppointments);
  const status = useSelector(selectClientStatus);
  const isLoading = useSelector(selectClientIsLoading);
  const error = useSelector(selectClientError);

  const load = useCallback(() => {
    dispatch(fetchClients(filters));
  }, [dispatch, JSON.stringify(filters)]); // eslint-disable-line

  const openClient = useCallback(
    (id: ClientId) => {
      dispatch(selectClient(id));
      dispatch(fetchClientAppointments(id));
    },
    [dispatch]
  );

  const closeClient = useCallback(() => {
    dispatch(selectClient(null));
  }, [dispatch]);

  const updateTags = useCallback(
    (id: ClientId, data: UpdateClientInput) =>
      dispatch(updateClientTags({ id, data })),
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
