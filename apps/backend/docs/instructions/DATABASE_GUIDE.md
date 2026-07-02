# Database Guide

> PostgreSQL via `pgx/v5` (sem ORM), migrations com `golang-migrate`.

---

## Stack

- **Driver:** `jackc/pgx/v5`, usado como pool (`pgxpool.Pool`), sem ORM — todo SQL é escrito à mão em `internal/repository/`.
- **Migrations:** `golang-migrate/migrate/v4`, apontando para `file://migrations`.
- **Execução:** as migrations rodam **automaticamente no boot** do `cmd/server/main.go`, **antes** de conectar o pool de aplicação. Não há passo de deploy dedicado a migrations — cada boot do binário já garante o schema atualizado.

---

## Migrations: `.up.sql` + `.down.sql`

Todas as migrations de `0001` a `0007` agora têm um `*.down.sql` correspondente, que reverte exatamente o que o `.up.sql` faz (`DROP TABLE`/`DROP INDEX`/`ALTER TABLE ... DROP COLUMN`, na ordem inversa de dependência de FK). Isso permite `migrate down` local para desfazer a última migration aplicada durante desenvolvimento.

**Mesmo assim, o uso recomendado em produção continua sendo forward-only.** Ter um `.down.sql` ajuda em desenvolvimento (desfazer uma migration recém-escrita antes de commitar) e documenta a reversão pretendida de cada mudança de schema, mas rodar `migrate down` contra um banco de produção com dados reais pode ser destrutivo (ex.: `DROP TABLE` de uma tabela que já tem linhas). Em produção, prefira sempre uma **nova migration corretiva** (`000X_fix_algo.up.sql`) a um rollback:

- Prefira mudanças aditivas (novas colunas nullable, novas tabelas) a mudanças destrutivas.
- Se precisar remover/renomear uma coluna, faça em duas migrations separadas (ex.: adicionar a nova, migrar dados, só depois de validado remover a antiga em outra migration) em vez de uma operação única e irreversível.
- Teste a migration (e seu `.down.sql`) localmente antes de subir para produção.

Ao criar uma migration nova, crie o par `NNNN_descricao.up.sql` + `NNNN_descricao.down.sql` juntos.

---

## Tabelas (ordem das migrations)

| Migration | Tabela(s) | Propósito |
|---|---|---|
| `0001_init.up.sql` | `branches` | Filiais/tenants: nome, telefone WhatsApp, token da Meta, plano, `bot_mode` (fixed/llm) |
| | `dashboard_users` | Usuários do dashboard (login, hash de senha, role, filial) |
| | `clients` | Clientes finais (contatos do WhatsApp) por filial. `name` é `NOT NULL DEFAULT ''` desde `0008` (ver abaixo) |
| | `conversations` | Conversas por cliente, com `status`, `bot_state` e `context` (JSONB) |
| | `messages` | Mensagens de cada conversa (`direction`: in/out) |
| | `appointments` | Agendamentos vinculados a um cliente |
| `0002_indexes.up.sql` | — | Índices em `clients.phone`, `clients.branch_id`, `conversations.client_id`, `messages.conversation_id`, `appointments.client_id`, `appointments.scheduled_at` |
| `0003_servicos_horarios.up.sql` | `services` | Catálogo de serviços por filial (nome, preço inicial, duração) |
| | `available_slots` | Horários disponíveis por filial (`period`: morning/afternoon/evening, `booked`) |
| `0004_llm_features.up.sql` | `branch_knowledge` | Base de conhecimento (RAG) usada pelo `LLMEngine` |
| `0005_messages_and_users_update.up.sql` | — | Adiciona `messages.read BOOLEAN` e `dashboard_users.name VARCHAR` |
| `0006_seed_test_data.up.sql` | — | **Esvaziada (no-op)** — seed de dev movido para `scripts/seed/seed.sql`, ver seção abaixo |
| `0007_seed_conversations.up.sql` | — | **Esvaziada (no-op)** — seed de dev movido para `scripts/seed/seed.sql`, ver seção abaixo |
| `0008_client_name_not_null.up.sql` | — | Backfill `clients.name = ''` onde `NULL`, depois `SET DEFAULT ''` e `SET NOT NULL` |

### Migrations 0006 e 0007: esvaziadas, seed movido para script manual

Essas duas migrations continham **dados fictícios de teste** (usuário admin com senha fraca conhecida, clientes fake, conversas fake) e rodavam automaticamente no boot como qualquer outra migration — inclusive contra um banco de produção "limpo" sem revisão prévia.

Isso foi resolvido: o conteúdo SQL exato de ambas foi movido para `apps/backend/scripts/seed/seed.sql`, e os arquivos `0006_seed_test_data.up.sql`/`0007_seed_conversations.up.sql` foram esvaziados (viraram no-op, só com um comentário explicando a mudança). Os arquivos **não foram deletados nem renomeados** — só esvaziados — para preservar a sequência de versões em bancos que já os tinham aplicado: `golang-migrate` (driver postgres) não valida checksum de conteúdo, só grava o número da versão em `schema_migrations`, então um banco que já rodou a versão 6/7 não é afetado (a migration não roda de novo), e um banco novo que rodar as migrations do zero simplesmente não recebe mais o seed automaticamente.

Efeito prático: **um `DATABASE_URL` de produção "limpo" nunca mais recebe dados fictícios automaticamente**, mesmo sem revisão prévia — o seed só acontece se alguém rodar `go run scripts/seed/main.go` manualmente (ver seção "Populando dados de seed" abaixo).

---

## `clients.name` é `NOT NULL DEFAULT ''`

`FindOrCreateClient` (usado pelo fluxo do webhook do WhatsApp) sempre criou clientes só com `phone`, sem `name` — a coluna não tinha `DEFAULT` nem `NOT NULL` até a migration `0008`, então esses clientes ficavam com `name = NULL` no Postgres. Como `models.Client.Name` é um `string` Go não-nullable, qualquer query que escaneasse `name` diretamente (`ListClients`, `GetClientByID`, `ListConversations` via `c.name`) quebrava com `cannot scan NULL into *string` para esses clientes.

A migration `0008_client_name_not_null.up.sql` faz o backfill (`UPDATE clients SET name = '' WHERE name IS NULL`) e adiciona `DEFAULT ''` + `NOT NULL` na coluna — o `INSERT` existente em `FindOrCreateClient` (que já não define `name`) passou a gravar `''` automaticamente via o `DEFAULT` da coluna, sem precisar mudar o `INSERT` em si. Coberto por `TestFindOrCreateClient_NoNameDoesNotBreakScans` em `internal/repository/repository_test.go`.

---

## Rodando migrations localmente

As migrations rodam sozinhas ao iniciar o servidor (`go run ./cmd/server` ou via `air`), lendo `DATABASE_URL` do `.env`. Não é necessário rodar `migrate` manualmente para desenvolvimento normal — basta subir a infra local (Postgres) e iniciar o backend.

Infra local via `docker-compose.yml` (raiz do monorepo): Postgres 15-alpine na porta `5432`, Redis 7-alpine na porta `6379`. Scripts auxiliares: `scripts/dev.ps1` (sobe tudo local).

Para criar uma nova migration, siga a convenção de nome usada: `NNNN_descricao_curta.up.sql`, incrementando o prefixo numérico (`0008_...`), colocada em `migrations/`. Escreva SQL padrão Postgres; não há um gerador de migration automatizado no projeto.

---

## Populando dados de seed

O seed de dev (filial de teste id=1, usuário `admin@test.com` / `admin123`, 6 serviços, ~20 slots, 6 registros de `branch_knowledge`, 5 clientes, 5 conversas com mensagens, 2 agendamentos) **não roda mais automaticamente** no boot. Rode manualmente, depois que as migrations já tiverem sido aplicadas (isto é, depois de o backend ter subido pelo menos uma vez):

```
go run scripts/seed/main.go
```

(a partir de `apps/backend`). O script:
- Lê `DATABASE_URL` do `.env` (via `godotenv`, igual ao resto da aplicação);
- Lê `scripts/seed/seed.sql` (caminho resolvido relativo ao próprio script, então funciona independente do diretório de onde for chamado);
- Executa o conteúdo como uma única transação — tudo ou nada;
- Loga `✅`/`❌` seguindo a convenção de prefixo emoji do projeto.

Rodar o script contra um banco que já tem os dados de seed (ex.: um banco onde as antigas migrations `0006`/`0007` já inseriram os dados, ou onde o script já rodou antes) falha com erro de chave duplicada (`branches_pkey`) — isso é esperado e seguro: o script não faz upsert, então rodar duas vezes não duplica dados, só falha explicitamente na segunda vez.

Para gerar o hash de senha de um novo usuário seed manualmente, use `scripts/genhash/main.go` (CLI standalone que gera hash Argon2id) e insira o hash resultante em `scripts/seed/seed.sql` ou via SQL direto no ambiente de dev.

---

## Convenções de query

- Sempre use placeholders `$1, $2, ...` do pgx para **valores** — nunca interpole valor de entrada via `fmt.Sprintf` na query.
- Nomes de coluna/cláusula `WHERE` dinâmicos (quando necessário) são montados de forma controlada no código, nunca a partir de entrada de usuário não validada.
- Toda query de listagem/detalhe de recurso de negócio deve filtrar por `branch_id` (ver `architecture/ARCHITECTURE.md`, seção multi-tenant).
