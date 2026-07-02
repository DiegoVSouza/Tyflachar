# Testing Guide

> Como rodar a suíte de testes, convenções de nomenclatura e como escrever um teste novo.

---

## Stack

- **Vitest** (`test.environment: 'jsdom'`, configurado em `vite.config.ts`)
- **@testing-library/react** + **@testing-library/jest-dom** para testes de hooks/componentes
- Setup global em `tests/setupTests.ts` (`test.setupFiles` em `vite.config.ts`): importa `@testing-library/jest-dom/vitest` (matchers como `toBeInTheDocument`) e registra `afterEach(cleanup)` explicitamente — este projeto **não** habilita `test.globals` no Vitest, então o auto-cleanup do Testing Library (que depende de um `afterEach` global) não dispararia sozinho.
- Sem MSW nem Playwright/Puppeteer instalados hoje — mocks de rede são feitos com `vi.fn()`/`vi.mock()` diretamente sobre `global.fetch`/módulos de serviço (ver exemplos abaixo).

---

## Como rodar

```bash
npm test              # roda vitest em modo watch
npx vitest run         # roda a suíte inteira uma vez (usado em CI/verificação final)
npx vitest run <path>  # roda um arquivo específico
```

---

## Convenção de nomenclatura

Os testes vivem numa pasta própria, `tests/`, replicando o caminho do arquivo dentro de `src/` (sem o prefixo `src/`), com o mesmo nome + `.test.ts` (ou `.test.tsx` se o teste precisar de JSX — ex.: `renderHook` com um `wrapper` de `Provider`):

```
src/services/api/apiClient.ts
tests/services/api/apiClient.test.ts

src/store/slices/authSlice.ts
tests/store/slices/authSlice.test.ts

src/hooks/useAuth.ts
tests/hooks/useAuth.test.tsx        ← .tsx porque o wrapper usa <Provider>
```

Imports dentro de `tests/` para módulos reais de `src/` usam o padrão "nu" do projeto (`services/api/apiClient`, `hooks/useAuth`, `store/slices/authSlice` — resolvidos via `baseUrl: "src"` do `tsconfig.json` + o plugin `vite-tsconfig-paths` no `vite.config.ts`). Imports para helpers que vivem dentro da própria `tests/` (ex.: `testStore.ts`) usam caminho relativo normal.

`test.include` em `vite.config.ts` está configurado explicitamente para `tests/**/*.test.{ts,tsx}` (Vitest não escaneia `src/` em busca de testes neste projeto).

---

## Escopo atual (pragmático, não é "tudo")

A suíte cobre hoje três camadas, deliberadamente **não** incluindo componentes de UI (`components/`, `pages/`, `templates/`) ainda:

| Camada | Cobertura |
|---|---|
| `src/services/api/apiClient.ts` | `ApiError`, métodos `get/post/put/patch/delete`, timeout/abort (`createAbortSignal`/`DEFAULT_TIMEOUT`), erro de rede, resposta não-OK, `upload()` |
| `src/store/slices/*.ts` (6 slices) | Estado inicial, reducers síncronos, thunks (`pending`/`fulfilled`/`rejected`) com o `service` correspondente mockado |
| Hooks críticos (`useAuth`, `useWebSocket`, `useApi`, `useDebounce`) | Comportamento assíncrono, integração com Redux (via `Provider` + store de teste), timers (`useDebounce`, backoff de reconexão do WebSocket) |

Se for adicionar teste de componente de UI no futuro, siga o mesmo padrão de nomenclatura (`Componente.test.tsx`) — não há convenção divergente esperada, só ainda não foi feito.

---

## Store de teste compartilhado para slices/hooks

`RootState` (`src/store/index.ts`) é um tipo manual que exige os 6 slices presentes — um `configureStore` com apenas o reducer sob teste não bate com esse tipo (os selectors do próprio slice esperam `RootState` completo). Em vez de duplicar a composição dos 6 reducers em cada arquivo, use o helper compartilhado:

```ts
// tests/store/slices/testStore.ts
import { createTestStore } from './testStore';

const store = createTestStore(); // compõe os 6 reducers reais — não é um *.test.ts, Vitest não o executa como suíte
```

Hooks que dependem de `useSelector`/`useDispatch` (ex.: `useAuth`, `useWebSocket`) usam o mesmo helper, envolvendo `renderHook` num `<Provider store={store}>`.

---

## Exemplo mínimo — teste de slice

```ts
// tests/store/slices/exampleSlice.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exampleService } from 'services/api/exampleService';
import { createTestStore } from './testStore';
import exampleReducer, { fetchItems, selectAllItems, selectExampleStatus } from 'store/slices/exampleSlice';

vi.mock('services/api/exampleService', () => ({
  exampleService: { list: vi.fn() },
}));

function makeStore() {
  return createTestStore(); // ou configureStore({ reducer: { example: exampleReducer } })
                             // se o slice novo ainda não estiver registrado em testStore.ts
}

describe('exampleSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has the expected initial state', () => {
    const store = makeStore();
    expect(store.getState().example.items).toEqual([]);
  });

  it('stores items on fetchItems success', async () => {
    vi.mocked(exampleService.list).mockResolvedValue({ items: [{ id: '1' }], total: 1 });

    const store = makeStore();
    await store.dispatch(fetchItems({}));

    expect(selectAllItems(store.getState())).toEqual([{ id: '1' }]);
    expect(selectExampleStatus(store.getState())).toBe('succeeded');
  });

  it('stores the error message on fetchItems failure', async () => {
    vi.mocked(exampleService.list).mockRejectedValue(new Error('offline'));

    const store = makeStore();
    await store.dispatch(fetchItems({}));

    expect(selectExampleStatus(store.getState())).toBe('failed');
  });
});
```

**Padrão de mock de fetch (usado em `apiClient.test.ts`):**

```ts
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: () => Promise.resolve({ data: 'x' }),
} as unknown as Response);
```

**Padrão de teste de hook com Redux (usado em `useAuth.test.tsx`):**

```tsx
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import { createTestStore } from '../store/slices/testStore';
import { useAuth } from 'hooks/useAuth';

function renderUseAuth() {
  const store = createTestStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { ...renderHook(() => useAuth(), { wrapper }), store };
}
```

---

## Checklist para escrever um teste novo

- [ ] Arquivo `<nome>.test.ts`/`.test.tsx` em `tests/`, replicando o caminho do arquivo testado dentro de `src/`
- [ ] Services externos mockados via `vi.mock('services/api/xService', ...)` — nunca bata numa API real
- [ ] `global.fetch` mockado diretamente para testes de `apiClient`, não os métodos de mais alto nível
- [ ] Thunks assíncronos testados nos três estados (`pending`, `fulfilled`, `rejected`) via `store.dispatch(...)` num store real (`configureStore`/`createTestStore`), não apenas invocando o reducer manualmente com uma action fake
- [ ] `vi.clearAllMocks()`/`vi.restoreAllMocks()` em `beforeEach`/`afterEach` para isolar testes
- [ ] `npx vitest run` passa localmente antes de abrir PR
