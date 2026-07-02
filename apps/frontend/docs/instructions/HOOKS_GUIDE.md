# Hooks Guide

> Hooks disponíveis no template e como criar novos.

---

## Hooks disponíveis

| Hook | Descrição |
|---|---|
| `useApi` | Wrapper genérico para chamadas de API com loading/error |
| `useAuth` | Dados do usuário autenticado e ações de auth |
| `useDebounce` | Debounce de valor (útil para inputs de busca) |
| `useLocalStorage` | Sincroniza estado com localStorage |
| `usePagination` | Lógica de paginação |
| `useToggle` | Toggle booleano simplificado |
| `useClickOutside` | Detecta clique fora de um elemento |
| `useMediaQuery` | Breakpoints responsivos |
| `useAppointments` | Lista/gerencia agendamentos do CRM (conecta a `appointmentSlice`) |
| `useClients` | Lista/gerencia clientes do CRM (conecta a `clientSlice`) |
| `useClientTheme` | Injeta o tema de um tenant (`config.theme`) como CSS custom properties em `document.documentElement`, com cleanup automático — ver seção dedicada abaixo |
| `useConversations` | Lista/gerencia conversas do Inbox (conecta a `conversationSlice`) |
| `useToastNotification` | Dispara uma notificação/toast genérica de app (success/error/warn/info), via `uiSlice` |
| `useConversationToasts` | Toasts de "nova mensagem" por conversa, dirigidos por eventos WebSocket (não é Redux) |
| `useScrollFrameAnimation` | Anima elementos por frame conforme o scroll (usado nos templates de landing page) |
| `useUsers` | Lista/gerencia usuários do CRM (conecta a `usersSlice`) |
| `useWebSocket` | Conexão WebSocket em tempo real para eventos do Inbox/agendamentos — ver seção dedicada abaixo |

> **Nota de nomenclatura (resolvida):** os hooks `useNotification`/`useNotifications` foram renomeados para `useToastNotification`/`useConversationToasts` — os nomes antigos eram quase idênticos e cobriam conceitos genuinamente diferentes (dispatcher genérico via Redux vs. lista de toasts de mensagem dirigida por WebSocket), o que gerava confusão. Não recrie hooks com nomes tão próximos sem uma distinção óbvia no nome.

---

## useApi — Hook genérico de requisição

```ts
import { useApi } from 'hooks/useApi';
import { clientService } from 'services/api/clientService';

function ClientList() {
  const { data, isLoading, error, execute, reset } = useApi(clientService.list);

  useEffect(() => {
    execute({ q: '' });
  }, []);

  // ...
}
```

**Retorno:**
- `data` — resultado da última chamada bem-sucedida
- `isLoading` — boolean
- `error` — string com mensagem de erro ou `null`
- `execute(params)` — dispara a chamada
- `reset()` — limpa `data`, `error` e `isLoading` de volta ao estado inicial (útil ao fechar um modal/drawer que usava o hook)

---

## useAuth — Autenticação

```ts
import { useAuth } from 'hooks/useAuth';

function Header() {
  const { user, isAuthenticated, isLoading, error, login, logout, refreshUser, clearError } = useAuth();

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Olá, {user?.name}</span>
          <button onClick={logout}>Sair</button>
        </>
      ) : (
        <button onClick={() => login({ email, password })}>Entrar</button>
      )}
    </header>
  );
}
```

**Retorno completo:**
- `user` — usuário autenticado (`User | null`)
- `isAuthenticated` — boolean
- `isLoading` — boolean (carregando login/refresh)
- `error` — string com mensagem de erro ou `null`
- `login(credentials)` — retorna `Promise<boolean>` (sucesso/falha)
- `logout()`
- `refreshUser()` — recarrega os dados do usuário atual (`fetchCurrentUser`)
- `clearError()` — limpa o erro de auth

---

## useWebSocket — Eventos em tempo real (Inbox / Agendamentos)

`src/hooks/useWebSocket.ts` mantém uma conexão WebSocket viva enquanto houver um token válido, usada pelo Dashboard/CRM para receber mensagens de conversas e novos agendamentos em tempo real (push do servidor, não polling).

```ts
import { useWebSocket } from 'hooks/useWebSocket';

function DashboardLayout() {
  const token = /* token do usuário autenticado */;
  const { wsStatus } = useWebSocket(token);

  // wsStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
}
```

**Como funciona:**
- Decodifica o JWT (`extractBranchId`) para extrair `branch_id` do payload e conecta em `${VITE_WS_URL}/ws/<branchId>?token=<token>`.
- **Reconexão automática com backoff:** ao desconectar (`onclose`), tenta reconectar após `RECONNECT_DELAY_MS` (3000ms), até `MAX_RECONNECT_ATTEMPTS = 10` tentativas.
- Eventos recebidos são despachados diretamente para os slices do Redux, sem passar por um thunk:
  - `new_message` → `conversationSlice.receiveMessage({ conversationId, message })`
  - `new_appointment` → `appointmentSlice.receiveNewAppointment(appointment)`
- Faz cleanup completo no unmount (`isUnmounting`, `clearTimeout`, `ws.close()`).

Esse é um padrão arquitetural relevante: parte do estado do app (mensagens novas, agendamentos criados por outro usuário) chega via push do servidor, não apenas via `createAsyncThunk`. Ao adicionar features que dependem de dados em tempo real, prefira despachar direto no `handleMessage` deste hook, seguindo o padrão existente.

---

## useClientTheme — Tema dinâmico por tenant (multitenant)

`src/hooks/useClientTheme.ts` resolve o ADR-002 (`docs/architecture/ARCHITECTURE.md`): injeta o tema de um tenant como CSS custom properties em runtime, sem exigir edição de `styles/tokens.css` por cliente novo.

```ts
import { useClientTheme } from 'hooks/useClientTheme';

function ClientPage({ page }: ClientPageProps) {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  // ...carrega config via CLIENT_REGISTRY...

  useClientTheme(config?.theme);

  // ...
}
```

**Como funciona:**
- Recebe `config.theme` (tipo `ClientTheme`, `src/types/client.types.ts`) — pode ser `undefined`/`null` enquanto o config ainda não carregou (o hook simplesmente não faz nada nesse caso).
- Num `useEffect`, mapeia os campos de `ClientTheme` (`colorPrimary`, `colorSecondary`, `colorBg`, `colorSurface`, `colorAccentWarm`, `fontHeading`, `fontBody`) para as CSS custom properties correspondentes em `styles/tokens.css` (`--brand-primary`, `--bg-page`, `--font-heading`, etc.) via `document.documentElement.style.setProperty(...)`.
- Variáveis auxiliares sem campo próprio no schema (`--brand-hover`, `--brand-active`, `--glass-fill`, `--glow-primary`, `--text-disabled`, etc.) são **derivadas** da paleta base com pequenos helpers de mistura de cor (`lighten`/`darken`/`withAlpha`, internos ao hook) — não são valores artesanais por tenant, são aproximações calculadas.
- Retorna uma função de **cleanup** que remove (`removeProperty`) todas as vars injetadas — disparada ao desmontar `ClientPage` ou quando `config.theme` muda (troca de tenant em navegação client-side), para não vazar tema de um cliente para o próximo.

**Ao adicionar um cliente novo:** basta preencher o bloco `theme` do `config.json` — não é mais necessário editar `styles/tokens.css` (ver `docs/instructions/CLIENTS_GUIDE.md`).

---

## useDebounce

```js
import { useDebounce } from 'hooks/useDebounce';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery) {
      // chama API só depois de 400ms sem digitar
      dispatch(fetchUsers({ search: debouncedQuery }));
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## useLocalStorage

```js
import { useLocalStorage } from 'hooks/useLocalStorage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Tema atual: {theme}
    </button>
  );
}
```

---

## usePagination

```js
import { usePagination } from 'hooks/usePagination';

function UserList({ totalItems }) {
  const { page, pageSize, totalPages, goToPage, nextPage, prevPage } =
    usePagination({ totalItems, defaultPageSize: 20 });

  useEffect(() => {
    dispatch(fetchUsers({ page, pageSize }));
  }, [page, pageSize]);

  return (
    <div>
      {/* lista */}
      <button onClick={prevPage} disabled={page === 1}>Anterior</button>
      <span>{page} / {totalPages}</span>
      <button onClick={nextPage} disabled={page === totalPages}>Próximo</button>
    </div>
  );
}
```

---

## Como criar um novo Hook

### Regras

1. Arquivo em `src/hooks/` com nome `useAlgumaCoisa.ts`
2. Começa com `use` — obrigatório pelo React
3. Retorna um objeto com nomes descritivos
4. Sem JSX — hooks não renderizam nada
5. Documente com JSDoc o que recebe e o que retorna

> **Nota sobre a regra 5:** na prática, **nenhum hook existente hoje** (`useApi`, `useAuth`, `useWebSocket` etc.) tem JSDoc — a tipagem TypeScript documenta parâmetros e retorno, mas não há comentários JSDoc descritivos. Trate a regra 5 como meta para hooks novos daqui para frente, não como o padrão atual do código.

### Template

```js
// src/hooks/useAlgumaCoisa.js

import { useState, useEffect, useCallback } from 'react';

/**
 * Descreva o que esse hook faz em uma linha.
 *
 * @param {Object} params
 * @param {string} params.id - ID do recurso
 * @returns {{ data: any, isLoading: boolean, error: string|null, refresh: Function }}
 */
export function useAlgumaCoisa({ id }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await algumaService.getById(id);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}
```

---

## Checklist para criar um hook

- [ ] Nome começa com `use`
- [ ] Arquivo em `src/hooks/`
- [ ] JSDoc com parâmetros e retorno documentados
- [ ] Sem JSX
- [ ] Retorna objeto com nomes descritivos
- [ ] `useCallback` em funções passadas como dependência de `useEffect`
- [ ] Cleanup de side effects quando necessário (`return () => cleanup()`)
