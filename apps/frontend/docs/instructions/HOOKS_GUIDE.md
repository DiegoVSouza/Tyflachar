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

---

## useApi — Hook genérico de requisição

```js
import { useApi } from '@/hooks/useApi';
import { productService } from '@/services/api/productService';

function ProductList() {
  const { data, isLoading, error, execute } = useApi(productService.list);

  useEffect(() => {
    execute({ active: true });
  }, []);

  // ...
}
```

**Retorno:**
- `data` — resultado da última chamada bem-sucedida
- `isLoading` — boolean
- `error` — string com mensagem de erro ou `null`
- `execute(params)` — dispara a chamada

---

## useAuth — Autenticação

```js
import { useAuth } from '@/hooks/useAuth';

function Header() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Olá, {user.name}</span>
          <button onClick={logout}>Sair</button>
        </>
      ) : (
        <button onClick={() => login({ email, password })}>Entrar</button>
      )}
    </header>
  );
}
```

---

## useDebounce

```js
import { useDebounce } from '@/hooks/useDebounce';

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
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
import { usePagination } from '@/hooks/usePagination';

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

1. Arquivo em `src/hooks/` com nome `useAlgumaCoisa.js`
2. Começa com `use` — obrigatório pelo React
3. Retorna um objeto com nomes descritivos
4. Sem JSX — hooks não renderizam nada
5. Documente com JSDoc o que recebe e o que retorna

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
