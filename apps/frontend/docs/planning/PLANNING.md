# Planning

> Roadmap vivo do projeto. Atualize a cada sprint.

---

> **Nota sobre fontes de verdade:** este arquivo (`docs/planning/PLANNING.md`) é o roadmap "oficial"/de longo prazo do projeto. Existe também `apps/frontend/.planning/context/project.md` (fora de `docs/`), que descreve a arquitetura atual do produto CRM "SharpEdge" com mais fidelidade ao estado real do código — ele é mantido como estado de trabalho ativo de sessões de IA e tende a refletir a implementação mais recentemente do que este documento. Use `.planning/context/project.md` como referência complementar/mais "viva" quando precisar do estado exato do código; use este `PLANNING.md` para o roadmap de médio/longo prazo e decisões de produto.

---

## Atualização 2026-07-02

Sessão dedicada a eliminar dívidas técnicas documentadas: suíte de testes criada do zero (`apiClient`, os 6 slices, hooks críticos), `clientSlice.ts` migrado para inglês, ADR-002 resolvido (tema por tenant agora é injetado dinamicamente via `useClientTheme`, sem mais overrides hardcoded em `tokens.css`), alias `@/` não utilizado removido de `tsconfig.json`, e os hooks `useNotification`/`useNotifications` renomeados para `useToastNotification`/`useConversationToasts` para eliminar a ambiguidade de nome. Detalhes em cada seção abaixo.

## Status Atual

**Sprint:** 2 — CRM/Dashboard em produção, multitenant estabilizado
**Responsável:** _preencha_

O projeto hoje hospeda **dois produtos** no mesmo codebase:
1. Gerador de microsite multitenant (rotas `/:clientSlug`, `/:clientSlug/blog`, `/:clientSlug/links`)
2. Dashboard/CRM autenticado (rotas `/dashboard/*`) — hoje representa a maior parte do código e estava **totalmente ausente** deste roadmap até esta revisão.

---

## ✅ Concluído

### Multitenant / Microsite

- Estrutura de pastas (`clients/`, `templates/`, `types/`)
- Redux Toolkit configurado (6 slices — ver seção CRM abaixo e `store/index.ts`)
- API service layer (`apiClient.ts` com `ApiError`, timeout automático, `upload()`)
- `ClientConfig` TypeScript types (`src/types/client.types.ts`)
- `LandingPageTemplate` com todas as seções (Nav, Hero, Philosophy, Services, Gallery, Testimonials, Newsletter, Footer)
- `config.json` do cliente `hairdresser`
- **Roteamento dinâmico por slug** via `CLIENT_REGISTRY` em `src/pages/ClientPage.tsx` (mapa estático slug → import dinâmico do `config.json`) — chegou a estar no backlog como "Roteamento dinâmico por cliente em App.tsx", mas a implementação real não usa rotas por cliente em `App.tsx`; usa rotas fixas + registry, ver `docs/architecture/ARCHITECTURE.md` (ADR-002) e `docs/instructions/CLIENTS_GUIDE.md`
- **Tema dinâmico por tenant (ADR-002 resolvido, 2026-07-02):** `src/hooks/useClientTheme.ts` injeta as CSS custom properties do tema a partir de `config.json` → `theme` em runtime, via `document.documentElement.style.setProperty`, com cleanup no unmount/troca de tenant. `src/styles/tokens.css` não tem mais blocos `[data-tenant='<slug>']` hardcoded — onboardar um cliente novo não requer mais editar CSS. Ver `docs/architecture/ARCHITECTURE.md` e `docs/instructions/HOOKS_GUIDE.md`.

### CRM / Dashboard

- **Sistema de agendamentos completo**: `appointmentService.ts` (API), `appointmentSlice.ts` (estado, incluindo recebimento de eventos via WebSocket), `useAppointments.ts` (hook), `AppointmentsPage.tsx` (página), `AppointmentsTable.tsx`, `NewAppointmentModal.tsx`, `ClientSearch.tsx`, `StatusBadge.tsx` (componentes de UI)
- Documentação base dos padrões (Redux, hooks, API, contribuição)
- **Suíte de testes automatizados (2026-07-02):** `src/setupTests.ts` criado; testes cobrindo `apiClient` (`ApiError`, métodos HTTP, timeout/abort, `upload()`), os 6 slices Redux (`<slice>.test.ts` ao lado de cada slice, com helper compartilhado `store/slices/testStore.ts`) e os hooks críticos `useAuth`, `useWebSocket`, `useApi`, `useDebounce`. Ver `docs/instructions/TESTING_GUIDE.md`.
- **`clientSlice.ts` migrado para inglês (2026-07-02):** nomes em português (`clientes`, `clienteSelecionadoId`, `agendamentosDoCliente`, `selecionarCliente`, `atualizarTagsCliente`) renomeados para o padrão em inglês dos demais slices (`clients`, `selectedClientId`, `clientAppointments`, `selectClient`, `updateClientTags`), com todos os consumidores (`useClients.ts` etc.) atualizados. Ver `docs/instructions/REDUX_GUIDE.md`.
- **Alias `@/` removido do `tsconfig.json` (2026-07-02):** nunca era usado no código real; removido para não confundir convenção de import.
- **Hooks de notificação renomeados (2026-07-02):** `useNotification` → `useToastNotification` (dispatcher genérico via `uiSlice`); `useNotifications` → `useConversationToasts` (toasts de nova mensagem dirigidos por WebSocket). Ver `docs/instructions/HOOKS_GUIDE.md`.

---

## 🆕 Produto CRM/Dashboard — descrição (ausente do roadmap anterior)

Esta seção documenta o que já está implementado e em produção, mas nunca apareceu neste roadmap:

### Autenticação
- Login (`LoginPage.tsx`), JWT persistido via `tokenStorage`, injetado automaticamente pelo `apiClient`
- `ProtectedRoute` (`components/shared/ProtectedRoute.tsx`) guardando toda a árvore `/dashboard/*`
- `useAuth.ts` — login, logout, `refreshUser`, `clearError`, estado de loading/erro

### Inbox — mensageria em tempo real
- `InboxPage.tsx`, `ConversationList.tsx`, `ConversationItem.tsx`, `MessagesPanel.tsx`, `MessageBubble.tsx`, `MessageInput.tsx`
- `conversationSlice.ts` / `conversationService.ts` / `useConversations.ts`
- Tempo real via `useWebSocket.ts`: reconexão automática com backoff, decodifica JWT para extrair `branch_id`, despacha `new_message` para `conversationSlice` e `new_appointment` para `appointmentSlice` — dados chegam por push do servidor, não apenas por thunk
- Indicador de status da conexão: `WsStatusIndicator.tsx`

### Agendamentos
- Ver seção "✅ Concluído" acima — sistema completo (listagem, criação, busca de cliente, status)

### Clientes do CRM
- `ClientsPage.tsx`, `ClientsTable.tsx`, `ClientDrawer.tsx`, `InputTags.tsx`
- `clientSlice.ts` / `clientService.ts` / `useClients.ts`
- ⚠️ Nota de nomenclatura: "Client" aqui = cliente do salão (CRM), **não** o mesmo conceito de "cliente" (tenant/marca) do produto multitenant. Ver `docs/architecture/ARCHITECTURE.md`.

### Usuários
- `usersSlice.ts` / `userService.ts` / `useUsers.ts` — gestão de usuários do CRM (ainda sem página dedicada mapeada neste documento; conferir estado atual em `.planning/context/project.md`)

### Layout
- `DashboardLayout.tsx`, `Sidebar.tsx`, `Header.tsx`/`AppLayout.tsx`

---

## Backlog

### 🔴 Crítico (bloqueia outros)

- [ ] Validação de schema do `config.json` em tempo de build (`zod` ou checagem TypeScript estrita)
- [ ] Definir contratos de API com backend para partes do multisite ainda sem backend real (leads, newsletter)

### 🟡 Alta prioridade

- [ ] Implementar `BlogTemplate` de verdade (hoje é só um placeholder de texto `<div>` em `ClientPage.tsx` — estrutura de posts, listagem e detalhe)
- [ ] Implementar `LinktreeTemplate` de verdade (mesma situação — hoje é só um placeholder de texto)
- [ ] Adicionar suporte a múltiplos idiomas no `config.json` (pt-BR / en)
- [ ] Expandir cobertura de testes para componentes de UI (`components/`, `pages/`, `templates/`) — a suíte atual cobre services, slices e hooks críticos, mas não componentes (ver `docs/instructions/TESTING_GUIDE.md`)

### 🟢 Normal

- [ ] Documentar todos os ícones disponíveis para `services.items[].icon`
- [ ] Página de erro 404 por cliente (respeitando o tema do cliente)
- [ ] Preview mode — renderizar config antes de publicar
- [ ] Otimizar imagens (lazy loading, WebP automático)
- [ ] Página dedicada de gestão de usuários no CRM (estado do slice/hook já existe: `usersSlice.ts` / `useUsers.ts`)
- [ ] Considerar expandir `ClientTheme` (`src/types/client.types.ts`) com campos adicionais (ex.: cor de hover/active explícita) se algum tenant futuro precisar de controle mais fino do que o `useClientTheme` consegue derivar automaticamente da paleta base — ver ADR-002 em `docs/architecture/ARCHITECTURE.md`

### ⚪ Futura / Nice-to-have

- [ ] CMS integrado — editar `config.json` via painel admin sem mexer em arquivos
- [ ] A/B testing por seção de landing page
- [ ] PWA / offline support
- [ ] Analytics por cliente (eventos de CTA, newsletter, galeria)

---

## Dívidas técnicas conhecidas

_(nenhuma pendente no momento — as quatro dívidas documentadas anteriormente aqui, "ausência de testes automatizados", "mistura de idioma no `clientSlice.ts`", "ADR-002 desatualizado" e "alias `@/` declarado mas nunca usado", foram todas resolvidas em 2026-07-02; ver "Atualização 2026-07-02" no topo deste documento e a seção "✅ Concluído" acima.)_

---

## Sprints

### Sprint 0 — Setup inicial ✅

| Task | Status |
|---|---|
| Criar estrutura de pastas (`clients/`, `templates/`, `types/`) | ✅ Feito |
| Configurar Redux Toolkit | ✅ Feito |
| Configurar API service layer | ✅ Feito |
| Criar `ClientConfig` TypeScript types | ✅ Feito |
| Documentar padrões base | ✅ Feito |

### Sprint 1 — Templates, clientes e roteamento ✅

| Task | Status | Responsável |
|---|---|---|
| `LandingPageTemplate` com todas as seções | ✅ Feito | — |
| `config.json` do cliente `hairdresser` | ✅ Feito | — |
| Roteamento dinâmico por slug (`CLIENT_REGISTRY`) | ✅ Feito | — |
| Aplicação de tema por tenant (`useClientTheme`, injeção dinâmica) | ✅ Feito | — |
| `BlogTemplate` (estrutura base) | 🔲 A fazer — hoje é só placeholder de texto | — |
| `LinktreeTemplate` (estrutura base) | 🔲 A fazer — hoje é só placeholder de texto | — |

### Sprint 2 — CRM/Dashboard (retroativo — implementado sem estar documentado)

| Task | Status | Responsável |
|---|---|---|
| Autenticação (login, JWT, `ProtectedRoute`) | ✅ Feito | — |
| Inbox com mensageria em tempo real (WebSocket) | ✅ Feito | — |
| Sistema de agendamentos completo | ✅ Feito | — |
| Gestão de clientes do CRM | ✅ Feito | — |
| Gestão de usuários (slice/hook prontos, página pendente) | 🔲 A fazer (página) | — |
| Testes automatizados (`apiClient`, 6 slices, hooks críticos) | ✅ Feito (2026-07-02) | — |

### Sprint 3 — _a definir_

| Task | Status | Responsável |
|---|---|---|
| _adicione aqui_ | 🔲 A fazer | — |

---

## Decisões pendentes

- [ ] Newsletter: Mailchimp, Brevo ou endpoint próprio?
- [ ] O roteamento por cliente será por subdomínio (`hairdresser.dominio.com`) ou permanece por path (`dominio.com/hairdresser`, atual)?
- [ ] Quem edita o `config.json` em produção — dev ou o próprio cliente via painel?

---

## Marcos

| Marco | Data alvo | Status |
|---|---|---|
| `LandingPageTemplate` funcional com cliente `hairdresser` | — | ✅ |
| Roteamento dinâmico por slug (`CLIENT_REGISTRY`) | — | ✅ |
| CRM/Dashboard funcional (auth, inbox, agendamentos, clientes) | — | ✅ |
| Todos os 3 templates multitenant ativos (`Landing`, `Blog`, `Linktree`) | — | 🔲 (Blog e Linktree ainda são placeholders) |
| Segundo cliente multitenant cadastrado e funcionando | — | 🔲 |
| Suíte de testes automatizados funcional (services, slices, hooks críticos) | — | ✅ (2026-07-02) |
| Deploy em produção com domínio próprio | — | 🔲 |

---

## Como atualizar este documento

1. A cada início de sprint: adicione uma nova seção de sprint
2. A cada task concluída: marque com ✅
3. Semanalmente: revise o backlog e repriorize se necessário
4. Ao encontrar divergência entre este documento e o código real, corrija aqui e considere também atualizar `apps/frontend/.planning/context/project.md` se for algo relevante ao estado ativo de trabalho
