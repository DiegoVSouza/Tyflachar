import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { conversationService, type ListConversationsFilters } from 'services/api/conversationService';
import type {
  Conversation,
  ConversationId,
  Message,
  SendMessageInput,
  LoadStatus,
} from 'types';
import type { RootState } from '../index';

interface ConversationState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  selectedConversationId: ConversationId | null;
  status: LoadStatus;
  messagesStatus: LoadStatus;
  error: string | null;
  totalUnread: number;
}

const initialState: ConversationState = {
  conversations: [],
  messages: {},
  selectedConversationId: null,
  status: 'idle',
  messagesStatus: 'idle',
  error: null,
  totalUnread: 0,
};

export const fetchConversations = createAsyncThunk(
  'conversation/fetchConversations',
  async (filters: ListConversationsFilters = {}, { rejectWithValue }) => {
    try {
      return await conversationService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'conversation/fetchMessages',
  async (id: ConversationId, { rejectWithValue }) => {
    try {
      const resp = await conversationService.listMessages(id);
      return { id, messages: resp.items };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async (
    { id, data }: { id: ConversationId; data: SendMessageInput },
    { rejectWithValue }
  ) => {
    try {
      const message = await conversationService.sendMessage(id, data);
      return { id, message };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    selectConversation(state, action: PayloadAction<ConversationId | null>) {
      state.selectedConversationId = action.payload;
      if (action.payload) {
        const conv = state.conversations.find((c) => c.id === action.payload);
        if (conv) conv.unread = 0;
      }
      state.totalUnread = state.conversations.reduce((sum, c) => sum + c.unread, 0);
    },

    receiveMessage(state, action: PayloadAction<{ conversationId: ConversationId; message: Message }>) {
      const { conversationId, message } = action.payload;
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.last_message = message.content;
        conv.last_message_at = message.timestamp;
        if (state.selectedConversationId !== conversationId) {
          conv.unread += 1;
        }
      }
      if (state.messages[conversationId]) {
        state.messages[conversationId].push(message);
      }
      state.conversations.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      state.totalUnread = state.conversations.reduce((sum, c) => sum + c.unread, 0);
    },

    clearConversationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.conversations = action.payload;
        state.totalUnread = action.payload.reduce((sum, c) => sum + c.unread, 0);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesStatus = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesStatus = 'succeeded';
        state.messages[action.payload.id] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesStatus = 'failed';
        state.error = action.payload as string;
      });

    builder.addCase(sendMessage.fulfilled, (state, action) => {
      const { id, message } = action.payload;
      if (!state.messages[id]) state.messages[id] = [];
      state.messages[id].push(message);
    });
  },
});

export const { selectConversation, receiveMessage, clearConversationError } = conversationSlice.actions;

// Selectors
export const selectConversations = (state: RootState) => state.conversation.conversations;
export const selectSelectedConversation = (state: RootState) =>
  state.conversation.conversations.find((c) => c.id === state.conversation.selectedConversationId) ?? null;
export const selectMessages = (conversationId: ConversationId) => (state: RootState) =>
  state.conversation.messages[conversationId] ?? [];
export const selectConversationsStatus = (state: RootState) => state.conversation.status;
export const selectMessagesStatus = (state: RootState) => state.conversation.messagesStatus;
export const selectConversationError = (state: RootState) => state.conversation.error;
export const selectTotalUnread = (state: RootState) => state.conversation.totalUnread;
export const selectSelectedConversationId = (state: RootState) =>
  state.conversation.selectedConversationId;

export default conversationSlice.reducer;