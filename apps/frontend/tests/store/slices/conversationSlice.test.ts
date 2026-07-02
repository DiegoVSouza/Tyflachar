import { beforeEach, describe, expect, it, vi } from 'vitest';
import { conversationService } from 'services/api/conversationService';
import type { Conversation, ConversationId, Message, PaginatedResponse } from 'types';
import { createTestStore } from './testStore';
import {
  clearConversationError,
  fetchConversations,
  fetchMessages,
  receiveMessage,
  selectConversation,
  selectConversationError,
  selectConversations,
  selectConversationsStatus,
  selectMessages,
  selectMessagesStatus,
  selectSelectedConversation,
  selectSelectedConversationId,
  selectTotalUnread,
  sendMessage,
} from 'store/slices/conversationSlice';

vi.mock('services/api/conversationService', () => ({
  conversationService: {
    list: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1' as ConversationId,
    client_id: 'client-1' as Conversation['client_id'],
    client_name: 'Ana',
    client_phone: '+5511999999999',
    last_message: 'Oi',
    last_message_at: '2024-01-01T10:00:00.000Z',
    unread: 0,
    status: 'open',
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1' as Message['id'],
    conversation_id: 'c1' as ConversationId,
    direction: 'in',
    content: 'Hello',
    type: 'text',
    status: 'received',
    timestamp: '2024-01-01T10:05:00.000Z',
    ...overrides,
  };
}

function makeStore() {
  return createTestStore();
}

describe('conversationSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has the expected initial state', () => {
    const store = makeStore();
    expect(store.getState().conversation).toEqual({
      conversations: [],
      messages: {},
      selectedConversationId: null,
      status: 'idle',
      messagesStatus: 'idle',
      error: null,
      totalUnread: 0,
    });
  });

  describe('selectConversation', () => {
    it('sets the selected conversation and zeroes its unread count', () => {
      const conv = makeConversation({ unread: 3 });
      const store = makeStore();
      store.dispatch({ type: fetchConversations.fulfilled.type, payload: [conv] });

      store.dispatch(selectConversation(conv.id));

      const state = store.getState();
      expect(selectSelectedConversationId(state)).toBe(conv.id);
      expect(selectSelectedConversation(state)?.unread).toBe(0);
      expect(selectTotalUnread(state)).toBe(0);
    });

    it('allows clearing the selection with null', () => {
      const store = makeStore();
      store.dispatch(selectConversation(null));
      expect(selectSelectedConversationId(store.getState())).toBeNull();
    });
  });

  describe('receiveMessage', () => {
    it('updates the conversation preview and pushes to the messages cache', () => {
      const conv = makeConversation({ id: 'c1' as ConversationId, unread: 0 });
      const store = makeStore();
      store.dispatch({ type: fetchConversations.fulfilled.type, payload: [conv] });
      store.dispatch({
        type: fetchMessages.fulfilled.type,
        payload: { id: conv.id, messages: [] },
      });

      const incoming = makeMessage({ content: 'New message', conversation_id: conv.id });
      store.dispatch(receiveMessage({ conversationId: conv.id, message: incoming }));

      const state = store.getState();
      expect(selectConversations(state)[0]).toMatchObject({
        last_message: 'New message',
        unread: 1,
      });
      expect(selectMessages(conv.id)(state)).toEqual([incoming]);
      expect(selectTotalUnread(state)).toBe(1);
    });

    it('does not increment unread for the currently selected conversation', () => {
      const conv = makeConversation({ id: 'c1' as ConversationId, unread: 0 });
      const store = makeStore();
      store.dispatch({ type: fetchConversations.fulfilled.type, payload: [conv] });
      store.dispatch(selectConversation(conv.id));

      store.dispatch(
        receiveMessage({ conversationId: conv.id, message: makeMessage({ conversation_id: conv.id }) })
      );

      expect(selectConversations(store.getState())[0]?.unread).toBe(0);
    });
  });

  it('clearConversationError resets the error field', () => {
    const store = makeStore();
    store.dispatch({ type: fetchConversations.rejected.type, payload: 'boom' });
    expect(selectConversationError(store.getState())).toBe('boom');
    store.dispatch(clearConversationError());
    expect(selectConversationError(store.getState())).toBeNull();
  });

  describe('fetchConversations thunk', () => {
    it('sets loading while pending', () => {
      const store = makeStore();
      store.dispatch({ type: fetchConversations.pending.type });
      expect(selectConversationsStatus(store.getState())).toBe('loading');
    });

    it('stores conversations and computes totalUnread on success', async () => {
      const list = [makeConversation({ unread: 2 }), makeConversation({ id: 'c2' as ConversationId, unread: 1 })];
      vi.mocked(conversationService.list).mockResolvedValue(list as unknown as Conversation[]);

      const store = makeStore();
      await store.dispatch(fetchConversations({}));

      const state = store.getState();
      expect(selectConversations(state)).toEqual(list);
      expect(selectTotalUnread(state)).toBe(3);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(conversationService.list).mockRejectedValue(new Error('offline'));

      const store = makeStore();
      await store.dispatch(fetchConversations({}));

      expect(selectConversationError(store.getState())).toBe('offline');
    });
  });

  describe('fetchMessages thunk', () => {
    it('sets messagesStatus to loading while pending', () => {
      const store = makeStore();
      store.dispatch({ type: fetchMessages.pending.type });
      expect(selectMessagesStatus(store.getState())).toBe('loading');
    });

    it('caches messages by conversation id on success', async () => {
      const messages = [makeMessage()];
      const paginated: PaginatedResponse<Message> = { items: messages, total: 1 };
      vi.mocked(conversationService.listMessages).mockResolvedValue(paginated);

      const store = makeStore();
      await store.dispatch(fetchMessages('c1' as ConversationId));

      const state = store.getState();
      expect(selectMessagesStatus(state)).toBe('succeeded');
      expect(selectMessages('c1' as ConversationId)(state)).toEqual(messages);
    });

    it('stores the error message on failure', async () => {
      vi.mocked(conversationService.listMessages).mockRejectedValue(new Error('not found'));

      const store = makeStore();
      await store.dispatch(fetchMessages('missing' as ConversationId));

      const state = store.getState();
      expect(selectMessagesStatus(state)).toBe('failed');
      expect(selectConversationError(state)).toBe('not found');
    });
  });

  describe('sendMessage thunk', () => {
    it('appends the sent message to the conversation cache on success', async () => {
      const sent = makeMessage({ direction: 'out', content: 'Reply' });
      vi.mocked(conversationService.sendMessage).mockResolvedValue(sent);

      const store = makeStore();
      await store.dispatch(sendMessage({ id: 'c1' as ConversationId, data: { content: 'Reply' } }));

      expect(selectMessages('c1' as ConversationId)(store.getState())).toEqual([sent]);
    });
  });
});
