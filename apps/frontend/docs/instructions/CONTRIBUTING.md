# Contributing

> Convenções e padrões do time para o CRM Multitenant.

---

## Commits

Use Conventional Commits:

```
type(scope): descrição curta em português

[corpo opcional]

[rodapé opcional: BREAKING CHANGE, closes #123]
```

**Tipos:**

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Somente documentação |
| `style` | Formatação (sem mudança de lógica) |
| `refactor` | Refatoração sem feat ou fix |
| `test` | Adição ou correção de testes |
| `chore` | Tarefas de manutenção (deps, config) |

**Exemplos:**
```
feat(auth): adicionar refresh token automático
fix(users): corrigir paginação na busca por nome
docs(api): atualizar exemplos do apiClient
```

---

## Branches

```
main          ← produção, sempre estável
develop       ← integração contínua
feat/nome     ← nova feature
fix/nome      ← correção de bug
docs/nome     ← documentação
```

Nomenclatura: `tipo/descricao-com-hifens`

---

## Pull Requests

**Título:** igual ao commit principal

**Template:**
```md
## O que muda
[Descrição do que foi feito]

## Por que
[Motivação ou link para task]

## Como testar
1. Acesse...
2. Faça...
3. Espere ver...

## Checklist
- [ ] Testei em dev
- [ ] Sem console.log solto
- [ ] Documentação atualizada se necessário
```

---

## Code Style

- **Identação:** 2 espaços
- **Aspas:** simples (`'`) em JS, duplas (`"`) em JSX
- **Ponto-e-vírgula:** sim
- **Trailing comma:** sim (multi-linha)
- **Comprimento máximo de linha:** 100 chars

O linter cuida automaticamente — não discuta estilo, configure o ESLint.

---

## Imports — Ordem

1. React e React Router
2. Libs externas
3. Store (Redux)
4. Hooks
5. Services
6. Componentes
7. Utils e types
8. Estilos (CSS Modules)

**Nota importante sobre imports:** o padrão real (confirmado em `App.tsx` e outros arquivos) é `baseUrl: "src"` com imports "nus", sem prefixo. O `tsconfig.json` já não declara mais um alias `@/*` (foi removido — nunca foi usado em nenhum arquivo real, era dívida técnica):

```ts
// 1. React
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Libs externas
import { format } from 'date-fns';

// 3. Store
import { useSelector } from 'react-redux';
import { store } from 'store';
import { selectCurrentUser } from 'store/slices/authSlice';

// 4. Hooks
import { useUsers } from 'hooks/useUsers';

// 5. Componentes
import { Button } from 'components/ui/Button';
import { ProtectedRoute } from 'components/shared/ProtectedRoute';

// 6. Utils e types
import { ClientConfig } from 'types/client.types';

// 7. Estilos
import styles from './MyPage.module.css';
```

Não use `@/...` em código novo — siga o padrão de import "nu" acima (equivalente a `baseUrl: "src"`). O alias `@/*` não existe mais no `tsconfig.json`.

---

## Proibições

❌ `console.log` em código commitado (use `console.warn` ou `console.error` se necessário)
❌ `any` em TypeScript
❌ Chamadas de API fora do service layer
❌ `useSelector` / `useDispatch` direto em componentes (use hooks)
❌ Estilos inline (`style={{ }}`) exceto para valores dinâmicos — **exceção conhecida hoje:** `App.tsx` (`LoadingFallback`, ~linhas 17-27) e `ClientPage.tsx` (tela de carregamento, ~linhas 108-116) usam `style={{ ... }}` com valores majoritariamente estáticos. Isso é dívida técnica a ser corrigida (mover para CSS Module), não um padrão a seguir em código novo.
❌ Comentários `// TODO` sem issue linkada

> **Nota:** o projeto é 100% TypeScript com `strict: true` — não há PropTypes em nenhum componente (nem faz sentido usá-los junto com tipagem estática).
