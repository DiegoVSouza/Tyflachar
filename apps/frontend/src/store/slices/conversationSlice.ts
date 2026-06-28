import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { conversationService, type ListConversationsFilters } from 'services/api/conversationService';
import type {
  Conversa,
  ConversaId,
  Mensagem,
  EnviarMensagemInput,
  LoadStatus,
} from 'types';
import type { RootState } from '../index';

interface ConversationState {
  conversas: Conversa[];
  mensagens: Record<string, Mensagem[]>;
  conversaSelecionadaId: ConversaId | null;
  status: LoadStatus;
  mensagensStatus: LoadStatus;
  error: string | null;
  totalunread: number;
}

const initialState: ConversationState = {
  conversas: [],
  mensagens: {},
  conversaSelecionadaId: null,
  status: 'idle',
  mensagensStatus: 'idle',
  error: null,
  totalunread: 0,
};

export const fetchConversas = createAsyncThunk(
  'conversation/fetchConversations',
  async (filters: ListConversationsFilters = {}, { rejectWithValue }) => {
    try {
      return await conversationService.list(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchMensagens = createAsyncThunk(
  'conversation/fetchMessages',
  async (id: ConversaId, { rejectWithValue }) => {
    try {
      const resp = await conversationService.listMessages(id);
      return { id, mensagens: resp.items };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const enviarMensagem = createAsyncThunk(
  'conversation/sendMessage',
  async (
    { id, data }: { id: ConversaId; data: EnviarMensagemInput },
    { rejectWithValue }
  ) => {
    try {
      const mensagem = await conversationService.sendMessage(id, data);
      return { id, mensagem };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    selecionarConversa(state, action: PayloadAction<ConversaId | null>) {
      state.conversaSelecionadaId = action.payload;
      if (action.payload) {
        const conv = state.conversas.find((c) => c.id === action.payload);
        if (conv) conv.unread = 0;
      }
      state.totalunread = state.conversas.reduce((sum, c) => sum + c.unread, 0);
    },

    receberMensagem(state, action: PayloadAction<{ conversaId: ConversaId; mensagem: Mensagem }>) {
      const { conversaId, mensagem } = action.payload;
      const conv = state.conversas.find((c) => c.id === conversaId);
      if (conv) {
        conv.last_message = mensagem.conteudo;
        conv.last_message_at = mensagem.criadaEm;
        if (state.conversaSelecionadaId !== conversaId) {
          conv.unread += 1;
        }
      }
      if (state.mensagens[conversaId]) {
        state.mensagens[conversaId].push(mensagem);
      }
      state.conversas.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      state.totalunread = state.conversas.reduce((sum, c) => sum + c.unread, 0);
    },

    clearConversationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversas.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchConversas.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.conversas = action.payload;
        state.totalunread = action.payload.reduce((sum, c) => sum + c.unread, 0);
      })
      .addCase(fetchConversas.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMensagens.pending, (state) => {
        state.mensagensStatus = 'loading';
      })
      .addCase(fetchMensagens.fulfilled, (state, action) => {
        state.mensagensStatus = 'succeeded';
        state.mensagens[action.payload.id] = action.payload.mensagens;
      })
      .addCase(fetchMensagens.rejected, (state, action) => {
        state.mensagensStatus = 'failed';
        state.error = action.payload as string;
      });

    builder.addCase(enviarMensagem.fulfilled, (state, action) => {
      const { id, mensagem } = action.payload;
      if (!state.mensagens[id]) state.mensagens[id] = [];
      state.mensagens[id].push(mensagem);
    });
  },
});

export const { selecionarConversa, receberMensagem, clearConversationError } = conversationSlice.actions;

export const selectConversas = (state: RootState) => state.conversation.conversas;
export const selectConversaSelecionada = (state: RootState) =>
  state.conversation.conversas.find((c) => c.id === state.conversation.conversaSelecionadaId) ?? null;
export const selectMensagens = (conversaId: ConversaId) => (state: RootState) =>
  state.conversation.mensagens[conversaId] ?? [];
export const selectConversaStatus = (state: RootState) => state.conversation.status;
export const selectMensagensStatus = (state: RootState) => state.conversation.mensagensStatus;
export const selectConversaError = (state: RootState) => state.conversation.error;
export const selectTotalunread = (state: RootState) => state.conversation.totalunread;
export const selectConversaSelecionadaId = (state: RootState) =>
  state.conversation.conversaSelecionadaId;

export default conversationSlice.reducer;
