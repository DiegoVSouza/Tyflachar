import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Conversation,
  ConversationId,
  ConversationStatus,
  Message,
  SendMessageInput,
  PaginatedResponse,
} from 'types';

const BASE = '/conversations';

export interface ListConversationsFilters {
  status?: ConversationStatus;
  page?: number;
  limit?: number;
}

export const conversationService = {
  list: (filters: ListConversationsFilters = {}) => {
    const url = buildUrl(BASE, filters as Record<string, string | number>);
    return apiClient.get<Conversation[]>(url);
  },

  listMessages: (id: ConversationId) =>
    apiClient.get<PaginatedResponse<Message>>(`${BASE}/${id}/messages`),

  sendMessage: (id: ConversationId, data: SendMessageInput) =>
    apiClient.post<Message>(`${BASE}/${id}/messages`, data),
};