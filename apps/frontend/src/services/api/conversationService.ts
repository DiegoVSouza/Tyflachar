import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type {
  Conversa,
  ConversaId,
  ConversaStatus,
  Mensagem,
  EnviarMensagemInput,
  PaginatedResponse,
} from 'types';

const BASE = '/conversations';

export interface ListConversationsFilters {
  status?: ConversaStatus;
  page?: number;
  limit?: number;
}

export const conversationService = {
  list: (filters: ListConversationsFilters = {}) => {
    const url = buildUrl(BASE, filters as Record<string, string | number>);
    return apiClient.get<Conversa[]>(url);
  },

  listMessages: (id: ConversaId) =>
    apiClient.get<PaginatedResponse<Mensagem>>(`${BASE}/${id}/messages`),

  sendMessage: (id: ConversaId, data: EnviarMensagemInput) =>
    apiClient.post<Mensagem>(`${BASE}/${id}/messages`, data),
};
