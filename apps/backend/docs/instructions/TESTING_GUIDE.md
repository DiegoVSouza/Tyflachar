# Testing Guide

> Como rodar a suíte de testes do backend e o que cada camada cobre.

---

## Visão geral

O projeto tem duas camadas de teste, ambas usando só a stdlib `testing` (sem framework externo):

| Camada | Pacotes | Precisa de infra externa? |
|---|---|---|
| Unitários puros | `internal/middleware`, `internal/handlers` | Não |
| Integração leve | `internal/repository` | Sim — Postgres real |

Rodar tudo:

```
go test ./...
```

(a partir de `apps/backend`).

---

## Testes unitários (sem infra)

- `internal/middleware/auth_test.go` — `JWTAuth`, `JWTAuthWS` e `RequireRole`. Gera tokens JWT válidos/expirados/com assinatura errada manualmente com `golang-jwt/jwt/v5` e bate na rota de teste via `app.Test(request)` (Fiber), confirmando o status HTTP e o conteúdo de `c.Locals`.
- `internal/handlers/webhook_handler_test.go` — `validSignature` (validação HMAC-SHA256 do webhook do WhatsApp): assinatura válida, assinatura forjada, corpo adulterado, e o comportamento permissivo quando `META_APP_SECRET` está vazio.
- `internal/handlers/password_test.go` — `hashPassword`/`verifyPassword` (Argon2id): senha correta, senha errada, e que dois hashes da mesma senha diferem (salt aleatório).

Esses testes nunca precisam de Postgres/Redis rodando — podem ser executados a qualquer momento, inclusive em CI sem infra:

```
go test ./internal/middleware/... ./internal/handlers/... -v
```

---

## Testes de integração — `internal/repository`

`internal/repository/repository_test.go` testa queries reais contra um Postgres real, focando no isolamento multi-tenant (que uma query filtrada por `branch_id` não vaza dados de outra filial).

### Pré-requisito

Suba a infra local a partir da **raiz do monorepo**:

```
docker compose up -d
```

Isso sobe o Postgres do `docker-compose.yml` na porta `5432` (usuário/senha/banco default: `admin`/`adminpassword`/`crm_db`, o mesmo do `.env.example`).

### Comportamento sem Postgres disponível

Se o Postgres não estiver acessível, os testes de `internal/repository` **são pulados** (`t.Skip`), não falham — isso mantém `go test ./...` verde em ambientes sem Docker (ex.: uma execução rápida local, ou CI sem infra provisionada). A checagem de disponibilidade roda uma vez por execução do pacote (`TestMain`), tentando conectar e, se conseguir, aplicando as migrations reais (reaproveitando `internal/database/migrate.go`) contra o banco apontado por `DATABASE_URL`.

### O que é testado

- `ListClients` / `GetClientByID` não retornam clientes de outra filial.
- `ListConversations` não retorna conversas de outra filial.
- `ListAppointments` / `UpdateAppointment` não afetam nem retornam agendamentos de outra filial.

Cada teste cria duas filiais descartáveis (nome/telefone únicos por execução) e limpa tudo que criou ao final via `t.Cleanup` (branches, clients, conversations, messages, appointments), então não deixa sujeira entre execuções nem exige um banco dedicado a testes.

### Rodando só esta camada

```
docker compose up -d          # a partir da raiz do monorepo
cd apps/backend
go test ./internal/repository/... -v
```

---

## Convenção para testes novos

- Arquivo `<nome>_test.go` ao lado do arquivo testado, no mesmo pacote.
- `func TestX(t *testing.T)`, sem necessidade de biblioteca externa de assertions.
- Se o teste depender de Postgres, siga o padrão de `internal/repository/repository_test.go`: cheque disponibilidade e use `t.Skip(...)` em vez de falhar quando a infra não estiver lá.
- Mudanças em área crítica (auth, webhook, agendamento, RBAC) devem vir acompanhadas de teste sempre que possível — ver checklist em `CONTRIBUTING.md`.
