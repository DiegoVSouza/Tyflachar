# Arquitetura

> Decisões técnicas do backend (`crm-whatsapp-api`) e o raciocínio por trás delas.

---

## Visão Geral

O backend é uma **API REST em Go** (Fiber v2, estilo Express sobre fasthttp) que serve o CRM multi-filial (multi-tenant) usado no dashboard e opera o motor de chatbot do WhatsApp. Não há GraphQL, não há ORM, não há framework de injeção de dependências — tudo é montado manualmente em `cmd/server/main.go`.

```
┌──────────────────────────────────────────────────────────────────┐
│                       WhatsApp Cloud API (Meta)                   │
│                  Webhooks  ⇅  Mensagens/Botões/Listas             │
└───────────────┬─────────────────────────────────────▲─────────────┘
                │ POST /webhook                        │ HTTP (Graph API)
                ▼                                       │
┌──────────────────────────────────────────────────────┴───────────┐
│                          cmd/server/main.go                       │
│   monta config, roda migrations, conecta pgx pool e Redis,        │
│   registra rotas, sobe ws.Hub, PSubscribe branch:*:events         │
├────────────────────────────────────────────────────────────────── ┤
│  routes/          →  único ponto de registro de rotas (Fiber)     │
├────────────────────────────────────────────────────────────────── ┤
│  middleware/       →  JWTAuth, JWTAuthWS, WebhookRateLimit         │
├────────────────────────────────────────────────────────────────── ┤
│  handlers/         →  controllers HTTP (parse request, valida,     │
│                        chama repository/chatbot, monta JSON)       │
├──────────────────────┬─────────────────────────┬─────────────────┤
│  chatbot/             │  whatsapp/               │  llm/           │
│  Engine (fixed) e      │  cliente HTTP da Graph   │  cliente HTTP   │
│  LLMEngine (RAG+tools) │  API (Meta)              │  Anthropic API  │
├──────────────────────┴─────────────────────────┴─────────────────┤
│  repository/        →  SQL puro via pgx/v5 (sem ORM)               │
├────────────────────────────────────────────────────────────────── ┤
│  models/            →  structs simples com tags json                │
├────────────────────────────────────────────────────────────────── ┤
│                    PostgreSQL (pgxpool)                            │
└────────────────────────────────────────────────────────────────── ┘

     ws/hub.go (WebSocket em memória, indexado por branchId)
              ▲
              │ Broadcast/BroadcastJSON
              │
     redisclient/publisher.go ── publica em branch:<id>:events ──► Redis Pub/Sub
              ▲                                                        │
              │ eventos gerados por handlers/chatbot                   │
              └─────────────── main.go faz PSubscribe branch:*:events ◄┘
```

Camadas de cima para baixo em uma requisição HTTP típica: **routes → handlers → repository → models**. O `chatbot/` é uma camada de domínio de negócio própria, paralela aos handlers HTTP — não é acionado por rotas do dashboard, mas pelo `webhook_handler.go` ao receber mensagens do WhatsApp.

---

## Multi-tenant via `branch_id`

O sistema atende múltiplas filiais (branches) com o mesmo backend e o mesmo banco. Não há schema separado por tenant nem banco separado: isolamento é feito por **filtro de `branch_id`** em praticamente toda query do `repository/`. O `branch_id` chega:

- Nas rotas autenticadas do dashboard: extraído do JWT (`c.Locals("branch_id")`, populado pelo middleware `JWTAuth`/`JWTAuthWS`).
- No webhook do WhatsApp: resolvido a partir do número de telefone/branch associado ao evento recebido da Meta.

Isso implica que **toda nova query ou handler precisa lembrar de filtrar por `branch_id`** — não existe um mecanismo automático (como Row Level Security do Postgres) garantindo isso; é uma convenção de código, não uma garantia de banco.

---

## ADRs — Architectural Decision Records

### ADR-001: SQL puro via `pgx/v5` em vez de ORM

**Status:** Aceito

**Contexto:** Precisávamos de queries previsíveis e de baixo overhead para um domínio relativamente simples (CRM + chatbot), sem a complexidade de mapear relações e migrations via ORM.

**Decisão:** Usar `jackc/pgx/v5` diretamente (`pgxpool.Pool`), com SQL escrito à mão em `internal/repository/`, e placeholders (`$1, $2, ...`) para todo valor de entrada.

**Consequências:**
- ✅ Controle total sobre as queries e seus planos de execução
- ✅ Sem "magia" de ORM escondendo N+1 queries
- ✅ Menos dependências, boot mais simples
- ⚠️ Não há checagem de tipos em tempo de compilação entre struct Go e coluna SQL
- ⚠️ Duplicação inevitável de SQL entre handlers parecidos (ex.: paginação repetida)

---

### ADR-002: Sem framework de injeção de dependências

**Status:** Aceito

**Contexto:** O projeto é pequeno o suficiente para não justificar um container de DI (wire, fx, etc.).

**Decisão:** `cmd/server/main.go` monta manualmente config → pool pgx → repository → chatbot engines → handlers, e injeta tudo via uma struct `Deps` passada para `routes.Setup`.

**Consequências:**
- ✅ Fluxo de inicialização é linear e fácil de seguir lendo um único arquivo
- ✅ Zero mágica de reflection em runtime
- ⚠️ `main.go` cresce conforme o número de dependências aumenta
- ⚠️ Testabilidade de `main.go` em si é baixa (mas as camadas internas são isoláveis)

---

### ADR-003: Dois motores de chatbot intercambiáveis por filial

**Status:** Aceito

**Contexto:** Nem toda filial precisa (ou quer pagar) por um motor baseado em LLM; algumas preferem um fluxo determinístico e previsível.

**Decisão:** Duas implementações da interface `BotEngine` (`internal/chatbot/interface.go`):
- `Engine` (fixed): máquina de estados fixa, sem custo de API externa.
- `LLMEngine`: usa Claude com RAG sobre `branch_knowledge` e tool calling.

A escolha é feita dinamicamente por filial, via coluna `branches.bot_mode` (`fixed` | `llm`), resolvida em `WebhookHandler.engine(branchID)`.

**Consequências:**
- ✅ Cada filial escolhe o trade-off custo/flexibilidade que faz sentido para ela
- ✅ Novo motor pode ser adicionado implementando só a interface `BotEngine`
- ⚠️ Sem `ANTHROPIC_API_KEY` configurada, `LLMEngine` fica desabilitado — filiais em modo `llm` sem a chave configurada ficam sem resposta de bot (comportamento a validar operacionalmente)

---

### ADR-004: Tempo real via Redis Pub/Sub + WebSocket Hub em memória

**Status:** Aceito

**Contexto:** O dashboard precisa refletir novas mensagens e agendamentos em tempo real. O backend pode rodar em mais de uma instância (Fly.io permite múltiplas máquinas).

**Decisão:** Eventos de domínio (`new_message`, `new_appointment`) são publicados no canal Redis `branch:<id>:events` (`internal/redisclient/publisher.go`). Cada instância do backend faz `PSubscribe("branch:*:events")` em `main.go` e repassa o evento para o seu `ws.Hub` local (`internal/ws/hub.go`), que faz o broadcast para os clientes WebSocket conectados àquela instância, filtrando por `branchId`.

**Consequências:**
- ✅ Múltiplas instâncias do backend compartilham eventos em tempo real sem estado compartilhado direto entre elas
- ✅ Hub em memória é simples — não precisa de um servidor WebSocket externo dedicado
- ⚠️ Se o Redis cair, o tempo real para de funcionar entre instâncias (mas a API REST continua operando normalmente)
- ⚠️ Conexões WebSocket ativas se perdem em caso de restart/scale-to-zero da máquina (auto_stop/auto_start no Fly)

---

### ADR-005: Migrations forward-only (sem rollback)

**Status:** Aceito (com ressalva documentada)

**Contexto:** `golang-migrate` roda automaticamente no boot do `main.go`, antes de conectar o pool de aplicação.

**Decisão:** Só existem arquivos `.up.sql` nas migrations (`migrations/0001` a `0007`). Não há `.down.sql`.

**Consequências:**
- ✅ Deploy simples: cada boot aplica migrations pendentes automaticamente, sem passo manual
- ⚠️ Reverter um erro de schema em produção exige escrever uma **nova migration corretiva**, não um rollback — ver `instructions/DATABASE_GUIDE.md`

---

## Convenções gerais de camadas

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| `routes/` | Registrar rotas Fiber, aplicar middleware | Lógica de negócio |
| `handlers/` | Parsear request, validar entrada, chamar repository/chatbot, montar resposta JSON | SQL direto, regras de negócio complexas |
| `chatbot/` | Decidir a próxima resposta do bot (fixed ou LLM) | Servir requisições HTTP do dashboard |
| `repository/` | Executar SQL via pgx, mapear linhas para models | Regras de negócio, formatação de resposta HTTP |
| `models/` | Structs de dados com tags `json` | Lógica de qualquer tipo |
| `whatsapp/`, `llm/` | Clientes HTTP para APIs externas (Meta, Anthropic) | Regras de negócio do CRM |
| `ws/`, `redisclient/` | Tempo real (hub em memória, pub/sub) | Lógica de domínio |
