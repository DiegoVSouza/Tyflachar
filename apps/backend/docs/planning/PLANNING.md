# Planning

> Roadmap vivo do backend (`crm-whatsapp-api`). Atualize conforme o projeto evolui.

---

## Status Atual

O backend está funcional e cobre o ciclo completo do produto: CRM multi-filial, dois motores de chatbot de WhatsApp, tempo real via WebSocket/Redis, e deploy automatizado para produção (Fly.io).

### O que já está pronto

| Área | Status |
|---|---|
| API REST (Fiber v2) com rotas de clientes, conversas, agendamentos e auth | ✅ Feito |
| Autenticação JWT (HS256) + Argon2id para senhas | ✅ Feito |
| Multi-tenant via `branch_id` em toda a camada de repository | ✅ Feito |
| Motor de chatbot `fixed` (máquina de estados) | ✅ Feito |
| Motor de chatbot `llm` (RAG sobre `branch_knowledge` + tool calling via Claude) | ✅ Feito |
| Escolha de motor por filial via `branches.bot_mode` | ✅ Feito |
| Webhook do WhatsApp com validação HMAC-SHA256 | ✅ Feito |
| Tempo real: Redis Pub/Sub (`branch:*:events`) + WebSocket Hub em memória | ✅ Feito |
| Migrations automáticas no boot (`golang-migrate`, 0001–0007), com `.up.sql` e `.down.sql` | ✅ Feito |
| Seed de dados de dev via script manual (`scripts/seed/main.go` + `scripts/seed/seed.sql`) | ✅ Feito |
| Dockerfile multi-stage + deploy automatizado via GitHub Actions → Fly.io | ✅ Feito |
| Dev local com hot-reload (`air`) + docker-compose (Postgres/Redis) | ✅ Feito |
| Testes automatizados: `middleware/auth.go` (JWT + RBAC), HMAC do webhook, Argon2id, isolamento multi-tenant em `repository/` | ✅ Feito |
| Infraestrutura de RBAC (claim `role` no JWT + `middleware.RequireRole`) | ✅ Feito (infra pronta, ainda não aplicada a nenhuma rota — ver dívidas técnicas) |
| Fail-fast no boot se `META_APP_SECRET` vazio em produção (`APP_ENV=production`) | ✅ Feito |
| `README.md` em `apps/backend` | ✅ Feito |
| `clients.name NOT NULL DEFAULT ''` (migration `0008`) — corrige quebra de scan em `ListClients`/`GetClientByID`/`ListConversations` para clientes criados só com telefone (fluxo do webhook) | ✅ Feito |

---

## Dívidas técnicas conhecidas

- 🟡 **RBAC existe como infraestrutura, mas não é aplicado a nenhuma rota.** `middleware.RequireRole` e a claim `role` no JWT estão prontos e testados (`internal/middleware/auth_test.go`), mas nenhuma rota real usa `RequireRole` hoje — as rotas atuais (`clients`, `conversations`, `appointments`) não são logicamente admin-only. Isso não é "sem RBAC" (a infra existe), mas também não é "RBAC resolvido de ponta a ponta" (falta uma rota real que precise dele para validar o caminho completo em produção). Rebaixado de 🔴 para 🟡 porque o bloqueio real — não ter como restringir uma rota por papel — foi removido; o que falta é só a rota admin-only em si, que ainda não existe como necessidade de produto.
- 🟢 **Cobertura de testes ainda não é ampla.** Existem testes para os módulos de maior risco (auth/JWT/RBAC, HMAC do webhook, Argon2id, isolamento multi-tenant do `repository`), mas não para chatbot (`internal/chatbot`), handlers de negócio (`client_handler.go`, `appointment_handler.go`, `conversation_handler.go`) nem `internal/whatsapp`/`internal/llm`. Rebaixado de 🔴 para 🟢 porque a lacuna crítica (zero testes) foi resolvida; o que resta é ampliação incremental, não uma ausência total.
- 🟢 **Migrations 0006/0007 esvaziadas, mas o texto histórico do seed antigo continua no header dos arquivos `.up.sql` originais só como comentário de transição.** Sem impacto funcional — documentado para quem for ler o histórico dessas duas migrations sem contexto.

---

## Backlog

### 🟡 Alta prioridade

- [ ] Quando a primeira rota genuinamente admin-only for criada (ex.: gestão de usuários do dashboard, configuração de filial), aplicar `middleware.RequireRole("admin")` e validar o fluxo ponta a ponta (hoje só a infraestrutura foi validada isoladamente, não uma rota real)
- [ ] Ampliar cobertura de teste para `internal/chatbot` (os dois motores de bot) e para os handlers de negócio (`client_handler.go`, `appointment_handler.go`, `conversation_handler.go`)

### 🟢 Normal

- [ ] Padronizar envelope de paginação entre os endpoints de listagem (hoje cada handler implementa a própria paginação sem metadados uniformes)
- [ ] Rate limiting em rotas do dashboard além do webhook, se o volume justificar
- [ ] Avaliar logging estruturado (JSON) como alternativa/complemento aos prefixos emoji, se a observabilidade em produção exigir

### ⚪ Futura / Nice-to-have

- [ ] Métricas/observabilidade (latência por rota, taxa de erro do webhook, uso de tokens do LLM)
- [ ] Suporte a mais de um motor de LLM (não só Anthropic)
- [ ] Cache de resultados de RAG (`branch_knowledge`) para reduzir latência/custo do `LLMEngine`

---

## Decisões pendentes

_(as três decisões que estavam aqui — plano de RBAC, estratégia de seed, investimento em `.down.sql` — foram tomadas e executadas: RBAC com papéis fixos admin/atendente via `middleware.RequireRole`; seed movido para `scripts/seed/` com as migrations 0006/0007 esvaziadas em vez de removidas; `.down.sql` criado para todas as migrations 0001–0007. Nenhuma decisão pendente registrada no momento.)_

---

## Como atualizar este documento

1. Ao fechar um item do backlog, marque com ✅ e mova a linha para "O que já está pronto" na próxima revisão.
2. Ao identificar uma nova dívida técnica, adicione-a na seção correspondente com o emoji de prioridade (🔴/🟡/🟢).
3. Revise este documento a cada mudança estrutural relevante no backend (nova tabela, novo motor de bot, mudança de infra de deploy).
