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

```js
// src/store/slices/exampleSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exampleService } from '@/services/api/exampleService';

// ─── Estado inicial ───────────────────────────────────────────
const initialState = {
  items: [],
  selectedItem: null,
  status: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
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

```js
// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import exampleReducer from './slices/exampleSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    example: exampleReducer,
    auth: authReducer,
    // adicione novos slices aqui
  },
});
```

---

## Consumindo no Componente (via Hook)

**Nunca use `useSelector` e `useDispatch` direto no componente.**
Sempre encapsule em um hook:

```js
// src/hooks/useExample.js
import { useSelector, useDispatch } from 'react-redux';
import { fetchItems, selectAllItems, selectIsLoading, selectExampleError } from '@/store/slices/exampleSlice';
import { useEffect } from 'react';

export function useExample(filters) {
  const dispatch = useDispatch();
  const items = useSelector(selectAllItems);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectExampleError);

  useEffect(() => {
    dispatch(fetchItems(filters));
  }, [dispatch, JSON.stringify(filters)]);

  return { items, isLoading, error };
}
```

```jsx
// src/pages/ExamplePage.jsx
import { useExample } from '@/hooks/useExample';

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

Sempre use o padrão de 4 status:

| Status | Significado |
|---|---|
| `idle` | Ainda não foi chamado |
| `loading` | Requisição em andamento |
| `succeeded` | Dados carregados com sucesso |
| `failed` | Ocorreu um erro |

---

## Checklist para criar um novo slice

- [ ] Estado inicial com `items`, `status`, `error`
- [ ] Thunks com `rejectWithValue` para erros
- [ ] Todos os `pending` / `fulfilled` / `rejected` tratados
- [ ] Selectors exportados (nunca acesse a store diretamente no componente)
- [ ] Adicionado ao `store/index.js`
- [ ] Hook correspondente criado em `src/hooks/`
