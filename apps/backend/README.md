# crm-whatsapp-api (backend)

API REST em Go para o CRM multi-filial de WhatsApp do Tyflachar: clientes, conversas,
agendamentos, autenticação de dashboard e dois motores de chatbot (máquina de estados
fixa e um motor via Claude com RAG/tool calling). Fiber v2 + `pgx/v5` (SQL puro, sem
ORM) + PostgreSQL + `golang-migrate` + Redis (Pub/Sub para tempo real) + JWT.

Para arquitetura, fluxo de dados, guia de auth/banco/chatbot/API, veja a pasta
[`docs/`](./docs) — em especial `docs/architecture/ARCHITECTURE.md` para a visão geral.

---

## Pré-requisitos

- Go 1.25+
- Docker (para subir Postgres + Redis via `docker-compose.yml`, na raiz do monorepo)

---

## Rodando localmente

1. Suba a infra (Postgres na porta `5432`, Redis na porta `6379`) a partir da **raiz do monorepo**:

   ```
   docker compose up -d
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente e ajuste os valores conforme necessário:

   ```
   cp .env.example .env
   ```

   (a partir de `apps/backend`). O `.env` já aponta para o Postgres/Redis locais do `docker-compose.yml` por padrão.

3. Suba o servidor:

   ```
   go run ./cmd/server
   ```

   As migrations em `migrations/` rodam automaticamente no boot (`golang-migrate`) — não é necessário rodar nenhum comando de migration à parte.

O servidor sobe em `http://localhost:8080` (ou o valor de `APP_PORT`).

### Hot-reload com `air`

O projeto já tem `.air.toml` configurado. Com [`air`](https://github.com/air-verse/air) instalado:

```
air
```

Isso recompila e reinicia o servidor automaticamente a cada mudança em um arquivo `.go`.

> Atalho: `scripts/dev.ps1` (Windows) / `scripts/dev.sh` (Linux/macOS/WSL), na raiz do monorepo, sobem infra + backend (com `air`) + frontend de uma vez.

### Seed de dados de desenvolvimento

O seed de dev (filial de teste, usuário `admin@test.com` / senha `admin123`, serviços,
horários disponíveis, clientes/conversas de exemplo) **não roda mais automaticamente**
no boot. Rode manualmente, depois que o backend já tiver subido pelo menos uma vez
(garantindo que as migrations foram aplicadas):

```
go run scripts/seed/main.go
```

Lê `DATABASE_URL` do `.env`, igual ao resto da aplicação, e executa `scripts/seed/seed.sql`
como uma única transação. Ver `docs/instructions/DATABASE_GUIDE.md` para detalhes de por
que isso deixou de ser uma migration automática.

---

## Testes

```
go test ./...
```

- Testes unitários puros (`internal/middleware`, `internal/handlers` — auth, HMAC do webhook, Argon2id) rodam sem nenhuma dependência externa.
- Testes de `internal/repository/` precisam de um Postgres real: suba a infra primeiro (`docker compose up -d` na raiz do monorepo). Se o Postgres local não estiver acessível, esses testes são pulados automaticamente (`t.Skip`) em vez de falhar.

Ver `docs/instructions/CONTRIBUTING.md` para convenções de teste e `docs/instructions/TESTING_GUIDE.md` para o guia completo de como rodar cada camada.

---

## Documentação

- [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md) — visão geral da arquitetura, multi-tenancy, motores de chatbot.
- [`docs/architecture/DATA_FLOW.md`](./docs/architecture/DATA_FLOW.md) — fluxo de dados ponta a ponta (webhook → bot → WebSocket).
- [`docs/instructions/API_GUIDE.md`](./docs/instructions/API_GUIDE.md) — rotas REST.
- [`docs/instructions/AUTH_GUIDE.md`](./docs/instructions/AUTH_GUIDE.md) — JWT, Argon2id, RBAC, validação HMAC do webhook.
- [`docs/instructions/DATABASE_GUIDE.md`](./docs/instructions/DATABASE_GUIDE.md) — schema, migrations, seed.
- [`docs/instructions/CHATBOT_GUIDE.md`](./docs/instructions/CHATBOT_GUIDE.md) — os dois motores de chatbot.
- [`docs/instructions/CONTRIBUTING.md`](./docs/instructions/CONTRIBUTING.md) — convenções do time.
- [`docs/planning/PLANNING.md`](./docs/planning/PLANNING.md) — roadmap e dívidas técnicas conhecidas.
