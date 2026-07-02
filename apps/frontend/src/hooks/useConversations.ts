import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { ConversationId, SendMessageInput } from 'types';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  selectConversation,
  selectConversations,
  selectSelectedConversation,
  selectSelectedConversationId,
  selectMessages,
  selectConversationsStatus,
  selectMessagesStatus,
  selectConversationError,
  selectTotalUnread,
} from 'store/slices/conversationSlice';
import type { ListConversationsFilters } from 'services/api/conversationService';

export function useConversations(filters: ListConversationsFilters = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const conversations = useSelector(selectConversations);
  const selectedConversation = useSelector(selectSelectedConversation);
  const selectedConversationId = useSelector(selectSelectedConversationId);
  const status = useSelector(selectConversationsStatus);
  const messagesStatus = useSelector(selectMessagesStatus);
  const error = useSelector(selectConversationError);
  const totalUnread = useSelector(selectTotalUnread);

  const messages = useSelector(
    selectedConversationId ? selectMessages(selectedConversationId) : () => []
  );

  const loadConversations = useCallback(() => {
    dispatch(fetchConversations(filters));
  }, [dispatch, JSON.stringify(filters)]); // eslint-disable-line

  const openConversation = useCallback(
    (id: ConversationId) => {
      dispatch(selectConversation(id));
      dispatch(fetchMessages(id));
    },
    [dispatch]
  );

  const closeConversation = useCallback(() => {
    dispatch(selectConversation(null));
  }, [dispatch]);

  const send = useCallback(
    (id: ConversationId, data: SendMessageInput) => {
      dispatch(sendMessage({ id, data }));
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