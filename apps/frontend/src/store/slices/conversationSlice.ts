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
  totalNaoLidas: number;
}

const initialState: ConversationState = {
  conversas: [],
  mensagens: {},
  conversaSelecionadaId: null,
  status: 'idle',
  mensagensStatus: 'idle',
  error: null,
  totalNaoLidas: 0,
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
        if (conv) conv.naoLidas = 0;
      }
      state.totalNaoLidas = state.conversas.reduce((sum, c) => sum + c.naoLidas, 0);
    },

    receberMensagem(state, action: PayloadAction<{ conversaId: ConversaId; mensagem: Mensagem }>) {
      const { conversaId, mensagem } = action.payload;
      const conv = state.conversas.find((c) => c.id === conversaId);
      if (conv) {
        conv.ultimaMensagem = mensagem.conteudo;
        conv.ultimaMensagemEm = mensagem.criadaEm;
        if (state.conversaSelecionadaId !== conversaId) {
          conv.naoLidas += 1;
        }
      }
      if (state.mensagens[conversaId]) {
        state.mensagens[conversaId].push(mensagem);
      }
      state.conversas.sort(
        (a, b) => new Date(b.ultimaMensagemEm).getTime() - new Date(a.ultimaMensagemEm).getTime()
      );
      state.totalNaoLidas = state.conversas.reduce((sum, c) => sum + c.naoLidas, 0);
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
        state.totalNaoLidas = action.payload.reduce((sum, c) => sum + c.naoLidas, 0);
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
export const selectTotalNaoLidas = (state: RootState) => state.conversation.totalNaoLidas;
export const selectConversaSelecionadaId = (state: RootState) =>
  state.conversation.conversaSelecionadaId;

export default conversationSlice.reducer;
