# API Guide

> Como usar o service layer para comunicação com APIs.

---

## Arquitetura do Service Layer

```
src/services/
├── api/
│   ├── apiClient.ts          ← cliente HTTP base (fetch wrapper) — inclui
│   │                            tratamento de erro (ApiError) e timeout,
│   │                            não há um handleResponse separado
│   ├── authService.ts        ← endpoints de autenticação
│   ├── userService.ts        ← endpoints de usuário
│   ├── appointmentService.ts ← endpoints de agendamentos
│   ├── clientService.ts      ← endpoints de clientes do CRM
│   └── conversationService.ts← endpoints de conversas/mensagens (Inbox)
└── utils/
    ├── buildUrl.ts          ← monta URLs com query params
    └── tokenStorage.ts      ← lê/escreve token no localStorage
```

**Services reais existentes hoje** em `src/services/api/`: `appointmentService.ts`, `authService.ts`, `clientService.ts`, `conversationService.ts`, `userService.ts` (além do próprio `apiClient.ts`).

---

## apiClient — O núcleo

O `apiClient` é um wrapper em cima do `fetch` nativo que:

- Injeta o token de autenticação automaticamente
- Adiciona headers padrão (`Content-Type`, `Accept`)
- Trata erros HTTP (4xx, 5xx) de forma padronizada, lançando `ApiError`
- Suporta cancelamento via `AbortController` (manual, passado pelo chamador) **e** timeout automático embutido

### Uso básico

```ts
import apiClient from 'services/api/apiClient';

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

```ts
import { buildUrl } from 'services/utils/buildUrl';

const url = buildUrl('/users', { page: 1, limit: 20, search: 'João' });
// → /users?page=1&limit=20&search=Jo%C3%A3o

const users = await apiClient.get(url);
```

### Com cancelamento manual

```ts
const controller = new AbortController();

const data = await apiClient.get('/users', {
  signal: controller.signal
});

// Cancela se o componente desmontar
useEffect(() => {
  return () => controller.abort();
}, []);
```

### Timeout automático embutido

Além do cancelamento manual acima, **toda requisição já tem um timeout automático**, implementado em `createAbortSignal` (`apiClient.ts`, linha ~17):

```ts
const DEFAULT_TIMEOUT = Number(import.meta.env['VITE_API_TIMEOUT'] ?? 15_000); // 15000ms
```

Se a requisição não responder dentro do timeout, o `AbortController` interno aborta a chamada automaticamente e o erro chega como `ApiError` (ver seção de erros abaixo). Você pode sobrescrever o timeout por chamada:

```ts
await apiClient.get('/relatorio-pesado', { timeout: 60_000 }); // 60s para essa chamada específica
```

O `signal` manual (`AbortController` do chamador) e o timeout automático coexistem — o cancelamento acontece pelo que disparar primeiro.

### Upload de arquivos (`apiClient.upload`)

Para `FormData`/multipart (upload de arquivos, imagens etc.), use `apiClient.upload` em vez de `post`. Ele **não** define `Content-Type` manualmente — o browser define o boundary do multipart automaticamente:

```ts
const formData = new FormData();
formData.append('file', file);
formData.append('description', 'Foto do salão');

const result = await apiClient.upload('/uploads', formData);
```

---

## Criando um Service

Cada domínio tem seu próprio service. Services reais hoje: `appointmentService.ts`, `authService.ts`, `clientService.ts`, `conversationService.ts`, `userService.ts`. Exemplo real (`clientService.ts`):

```ts
// src/services/api/clientService.ts

import apiClient from './apiClient';
import { buildUrl } from '../utils/buildUrl';
import type { Client, ClientId, UpdateClientInput, PaginatedResponse, Appointment } from 'types';

const BASE = '/clients';

export interface ListClientsFilters {
  q?: string;
  page?: number;
  limit?: number;
}

export const clientService = {
  list: (filters: ListClientsFilters = {}) => {
    const url = buildUrl(BASE, filters as Record<string, string | number>);
    return apiClient.get<PaginatedResponse<Client>>(url);
  },

  getById: (id: ClientId) => apiClient.get<Client>(`${BASE}/${id}`),

  getAppointments: (id: ClientId) => apiClient.get<Appointment[]>(`${BASE}/${id}/appointments`),

  updateTags: (id: ClientId, data: UpdateClientInput) =>
    apiClient.patch<Client>(`${BASE}/${id}/tags`, data),
};
```

Outro exemplo real, `appointmentService.ts`, segue o mesmo padrão (`list`, `create`, `update`, `remove`) consumindo `apiClient` e `buildUrl`.

---

## Tratamento de Erros

O `apiClient` **não** lança um objeto plano. Ele lança uma classe `ApiError extends Error` (definida em `apiClient.ts`, linhas ~21-33):

```ts
export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
```

- `error.message` — mensagem legível (herdada de `Error`)
- `error.status: number` — status HTTP (ou `0` para erros de rede/timeout/cancelamento)
- `error.data: unknown` — body da resposta de erro, se houver (somente leitura)

No service, você pode enriquecer o erro:

```ts
create: async (data: CreateClientInput) => {
  try {
    return await apiClient.post(BASE, data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new Error('Cliente com esse nome já existe.');
    }
    throw error; // relança erros não tratados
  }
}
```

No slice (Redux), capture no `createAsyncThunk`:

```ts
export const createClient = createAsyncThunk(
  'client/create',
  async (data: CreateClientInput, { rejectWithValue }) => {
    try {
      return await clientService.create(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);
```

---

## Configuração de Ambiente

Variáveis de ambiente no `.env`:

```
VITE_API_BASE_URL=https://api.seudominio.com/v1
VITE_API_TIMEOUT=15000
VITE_WS_URL=wss://api.seudominio.com
```

- `VITE_API_BASE_URL` — lido automaticamente pelo `apiClient`
- `VITE_API_TIMEOUT` — timeout padrão (ms) de cada requisição, usado por `createAbortSignal`
- `VITE_WS_URL` — endpoint base do WebSocket, usado por `src/hooks/useWebSocket.ts` para o Inbox/agendamentos em tempo real (default: `ws://localhost:8080` se não definido)

---

## Autenticação

O token é gerenciado pelo `tokenStorage.ts` e injetado automaticamente pelo `apiClient`.

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
