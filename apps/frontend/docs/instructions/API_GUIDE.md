# API Guide

> Como usar o service layer para comunicação com APIs.

---

## Arquitetura do Service Layer

```
src/services/
├── api/
│   ├── apiClient.js        ← cliente HTTP base (fetch wrapper)
│   ├── authService.js      ← exemplo: endpoints de autenticação
│   └── userService.js      ← exemplo: endpoints de usuário
└── utils/
    ├── buildUrl.js         ← monta URLs com query params
    ├── handleResponse.js   ← trata status HTTP e erros
    └── tokenStorage.js     ← lê/escreve token no localStorage
```

---

## apiClient — O núcleo

O `apiClient` é um wrapper em cima do `fetch` nativo que:

- Injeta o token de autenticação automaticamente
- Adiciona headers padrão (`Content-Type`, `Accept`)
- Trata erros HTTP (4xx, 5xx) de forma padronizada
- Suporta cancelamento via `AbortController`

### Uso básico

```js
import apiClient from '@/services/api/apiClient';

// GET
const user = await apiClient.get('/users/1');

// POST
const newUser = await apiClient.post('/users', { name: 'João', email: 'joao@email.com' });

// PUT
const updated = await apiClient.put('/users/1', { name: 'João Silva' });

// PATCH
const patched = await apiClient.patch('/users/1', { email: 'novo@email.com' });

// DELETE
await apiClient.delete('/users/1');
```

### Com query params

```js
import { buildUrl } from '@/services/utils/buildUrl';

const url = buildUrl('/users', { page: 1, limit: 20, search: 'João' });
// → /users?page=1&limit=20&search=Jo%C3%A3o

const users = await apiClient.get(url);
```

### Com cancelamento

```js
const controller = new AbortController();

const data = await apiClient.get('/users', {
  signal: controller.signal
});

// Cancela se o componente desmontar
useEffect(() => {
  return () => controller.abort();
}, []);
```

---

## Criando um Service

Cada domínio tem seu próprio service. Exemplo:

```js
// src/services/api/productService.js

import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';

const BASE = '/products';

export const productService = {
  list: (filters = {}) => {
    const url = buildUrl(BASE, filters);
    return apiClient.get(url);
  },

  getById: (id) => apiClient.get(`${BASE}/${id}`),

  create: (data) => apiClient.post(BASE, data),

  update: (id, data) => apiClient.put(`${BASE}/${id}`, data),

  remove: (id) => apiClient.delete(`${BASE}/${id}`),
};
```

---

## Tratamento de Erros

O `apiClient` lança erros com a seguinte estrutura:

```js
{
  message: 'Não autorizado',   // mensagem legível
  status: 401,                  // status HTTP
  data: { ... }                 // body da resposta de erro, se houver
}
```

No service, você pode enriquecer o erro:

```js
create: async (data) => {
  try {
    return await apiClient.post(BASE, data);
  } catch (error) {
    if (error.status === 409) {
      throw new Error('Produto com esse nome já existe.');
    }
    throw error; // relança erros não tratados
  }
}
```

No slice (Redux), capture no `createAsyncThunk`:

```js
export const createProduct = createAsyncThunk(
  'products/create',
  async (data, { rejectWithValue }) => {
    try {
      return await productService.create(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

---

## Configuração de Ambiente

Variáveis de ambiente no `.env`:

```
VITE_API_BASE_URL=https://api.seudominio.com/v1
VITE_API_TIMEOUT=10000
```

O `apiClient` lê automaticamente o `VITE_API_BASE_URL`.

---

## Autenticação

O token é gerenciado pelo `tokenStorage.js` e injetado automaticamente pelo `apiClient`.

Fluxo:
1. Usuário faz login → `authService.login()` retorna o token
2. Slice de auth salva o token via `tokenStorage.setToken()`
3. Toda requisição subsequente inclui `Authorization: Bearer <token>`
4. Ao fazer logout → `tokenStorage.clearToken()`

---

## Checklist para criar um novo service

- [ ] Criou o arquivo em `src/services/api/`
- [ ] Importou `apiClient`
- [ ] Usou `buildUrl` para endpoints com filtros
- [ ] Tratou erros específicos do domínio
- [ ] Exportou como objeto nomeado (`export const xService = { ... }`)
- [ ] Documentou os métodos com JSDoc
