# Redux Guide

> Padrão de slices, actions, thunks e selectors.

---

## Filosofia

- **Slice = um domínio** (users, products, auth, ui)
- **Thunk = operação assíncrona** (buscar, salvar, deletar)
- **Selector = leitura do estado** (nunca acesse `state.x.y` diretamente no componente)
- **Action = intenção** (nomes no imperativo: `fetchUsers`, `createProduct`)

---

## Estrutura de um Slice

```ts
// src/store/slices/exampleSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exampleService } from 'services/api/exampleService';
import type { LoadStatus } from 'types';

// ─── Estado inicial ───────────────────────────────────────────
const initialState = {
  items: [],
  selectedItem: null,
  status: 'idle' as LoadStatus,    // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// ─── Thunks (operações assíncronas) ──────────────────────────
export const fetchItems = createAsyncThunk(
  'example/fetchItems',
  async (filters, { rejectWithValue }) => {
    try {
      return await exampleService.list(filters);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createItem = createAsyncThunk(
  'example/createItem',
  async (data, { rejectWithValue }) => {
    try {
      return await exampleService.create(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────
const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    // Actions síncronas
    selectItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchItems
    builder
      .addCase(fetchItems.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });

    // createItem
    builder
      .addCase(createItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(createItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// ─── Actions ─────────────────────────────────────────────────
export const { selectItem, clearError, resetState } = exampleSlice.actions;

// ─── Selectors ───────────────────────────────────────────────
export const selectAllItems = (state) => state.example.items;
export const selectSelectedItem = (state) => state.example.selectedItem;
export const selectExampleStatus = (state) => state.example.status;
export const selectExampleError = (state) => state.example.error;
export const selectIsLoading = (state) => state.example.status === 'loading';

export default exampleSlice.reducer;
```

---

## Registrando o Slice na Store

A store real (`src/store/index.ts`) registra 6 slices e exporta `RootState`/`AppDispatch` **explicitamente** (não apenas inferidos via `ReturnType<typeof store.getState>`), além de um middleware customizado condicional em dev:

```ts
// src/store/index.ts
import { configureStore, type Middleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import usersReducer from './slices/usersSlice';
import conversationReducer from './slices/conversationSlice';
import appointmentReducer from './slices/appointmentSlice';
import clientReducer from './slices/clientSlice';
import { loggerMiddleware } from './middleware/loggerMiddleware';

const reducer = {
  auth: authReducer,
  ui: uiReducer,
  users: usersReducer,
  conversation: conversationReducer,
  appointment: appointmentReducer,
  client: clientReducer,
  // adicione novos slices aqui
};

const devMiddlewares: Middleware[] =
  import.meta.env.NODE_ENV !== 'production' ? [loggerMiddleware] : [];

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...devMiddlewares),
  devTools: import.meta.env.NODE_ENV !== 'production',
});

export type RootState = {
  auth: ReturnType<typeof authReducer>;
  ui: ReturnType<typeof uiReducer>;
  users: ReturnType<typeof usersReducer>;
  conversation: ReturnType<typeof conversationReducer>;
  appointment: ReturnType<typeof appointmentReducer>;
  client: ReturnType<typeof clientReducer>;
};
export type AppDispatch = typeof store.dispatch;
```

`src/store/middleware/loggerMiddleware.ts` é um middleware Redux customizado, registrado apenas em modo dev (`import.meta.env.NODE_ENV !== 'production'`, linhas ~19-20 e 25 de `store/index.ts`). Ele não estava documentado antes desta revisão — se for logar/inspecionar actions em dev, é ali que a lógica vive.

---

## Consumindo no Componente (via Hook)

**Nunca use `useSelector` e `useDispatch` direto no componente.**
Sempre encapsule em um hook:

```ts
// src/hooks/useExample.ts
import { useSelector, useDispatch } from 'react-redux';
import { fetchItems, selectAllItems, selectIsLoading, selectExampleError } from 'store/slices/exampleSlice';
import { useEffect } from 'react';
import type { AppDispatch } from 'store';

export function useExample(filters) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectAllItems);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectExampleError);

  useEffect(() => {
    dispatch(fetchItems(filters));
  }, [dispatch, JSON.stringify(filters)]);

  return { items, isLoading, error };
}
```

```tsx
// src/pages/ExamplePage.tsx
import { useExample } from 'hooks/useExample';

export function ExamplePage() {
  const { items, isLoading, error } = useExample({ active: true });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;
  if (!items.length) return <p>Nenhum item encontrado.</p>;

  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

---

## Status Pattern

Sempre use o padrão de 4 status, tipado pelo tipo compartilhado `LoadStatus` (`src/types/index.ts`):

| Status | Significado |
|---|---|
| `idle` | Ainda não foi chamado |
| `loading` | Requisição em andamento |
| `succeeded` | Dados carregados com sucesso |
| `failed` | Ocorreu um erro |

```ts
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
```

**Múltiplos campos de status por slice:** quando um slice tem duas operações independentes no mesmo domínio (ex.: listar vs. carregar detalhes), use um campo de status separado para cada uma em vez de reaproveitar um único `status`. Exemplo real, `clientSlice.ts`: `status` (para `fetchClients`) e `detailsStatus` (para `fetchClientAppointments`) são campos independentes, permitindo que a UI mostre loading da lista e loading dos detalhes do cliente selecionado sem conflito.

---

## Testes de slice

Todo slice em `src/store/slices/` tem um arquivo `<slice>.test.ts` ao lado (ex.: `authSlice.test.ts`, `clientSlice.test.ts`), cobrindo estado inicial, reducers síncronos e os três estados (`pending`/`fulfilled`/`rejected`) de cada thunk, com a chamada de `service` correspondente mockada via `vi.mock`. Um slice novo deve vir com seu próprio `<slice>.test.ts` seguindo o mesmo padrão — ver `docs/instructions/TESTING_GUIDE.md` para a convenção completa e um helper compartilhado (`store/slices/testStore.ts`) que compõe os 6 reducers reais para bater com o tipo `RootState`.

---

## Checklist para criar um novo slice

- [ ] Estado inicial com `items` (ou nome de domínio equivalente), `status: LoadStatus`, `error`
- [ ] Nomes em **inglês** (todos os 6 slices seguem esse padrão hoje)
- [ ] Se houver operações independentes no mesmo domínio, use um campo de status por operação (ex.: `status` + `detailsStatus`)
- [ ] Thunks com `rejectWithValue` para erros
- [ ] Todos os `pending` / `fulfilled` / `rejected` tratados
- [ ] Selectors exportados (nunca acesse a store diretamente no componente)
- [ ] Adicionado ao `store/index.ts`
- [ ] Hook correspondente criado em `src/hooks/`
- [ ] `<slice>.test.ts` criado ao lado, cobrindo estado inicial + reducers + thunks (ver `docs/instructions/TESTING_GUIDE.md`)
