import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { ConversaId, EnviarMensagemInput } from 'types';
import {
  fetchConversas,
  fetchMensagens,
  enviarMensagem,
  selecionarConversa,
  selectConversas,
  selectConversaSelecionada,
  selectConversaSelecionadaId,
  selectMensagens,
  selectConversaStatus,
  selectMensagensStatus,
  selectConversaError,
  selectTotalNaoLidas,
} from 'store/slices/conversationSlice';
import type { ListConversationsFilters } from 'services/api/conversationService';

export function useConversations(filters: ListConversationsFilters = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const conversations = useSelector(selectConversas);
  const selectedConversation = useSelector(selectConversaSelecionada);
  const selectedConversationId = useSelector(selectConversaSelecionadaId);
  const status = useSelector(selectConversaStatus);
  const messagesStatus = useSelector(selectMensagensStatus);
  const error = useSelector(selectConversaError);
  const totalUnread = useSelector(selectTotalNaoLidas);

  const messages = useSelector(
    selectedConversationId ? selectMensagens(selectedConversationId) : () => []
  );

  const loadConversations = useCallback(() => {
    dispatch(fetchConversas(filters));
  }, [dispatch, JSON.stringify(filters)]); // eslint-disable-line

  const openConversation = useCallback(
    (id: ConversaId) => {
      dispatch(selecionarConversa(id));
      dispatch(fetchMensagens(id));
    },
    [dispatch]
  );

  const closeConversation = useCallback(() => {
    dispatch(selecionarConversa(null));
  }, [dispatch]);

  const send = useCallback(
    (id: ConversaId, data: EnviarMensagemInput) => {
      dispatch(enviarMensagem({ id, data }));
    },
    [dispatch]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    selectedConversation,
    messages,
    isLoading: status === 'loading',
    isMessagesLoading: messagesStatus === 'loading',
    error,
    totalUnread,
    openConversation,
    closeConversation,
    send,
    reload: loadConversations,
  };
}
