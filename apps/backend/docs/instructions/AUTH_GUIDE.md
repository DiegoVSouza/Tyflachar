# Auth Guide

> JWT, Argon2id e validação de webhook — como a autenticação e a autorização funcionam hoje, e as lacunas conhecidas.

---

## JWT

- Biblioteca: `golang-jwt/jwt/v5`.
- Algoritmo: **HS256**, chave simétrica via env `JWT_SECRET`.
- Emitido em `POST /api/auth/login` (`AuthHandler.Login`, `internal/handlers/auth_handler.go`).
- Claims:

| Claim | Conteúdo |
|---|---|
| `user_id` | id do `dashboard_users` autenticado |
| `branch_id` | filial à qual o usuário pertence — usado para multi-tenancy em todas as rotas |
| `role` | papel do usuário (`dashboard_users.role`, hoje sempre `admin` por padrão — ver seção RBAC abaixo) |
| `exp` | expiração, **72 horas** a partir da emissão |

- Consumo: middleware `middleware.JWTAuth(secret)` para rotas REST (header `Authorization: Bearer <token>`) e `middleware.JWTAuthWS(secret)` para o WebSocket (query string `?token=`). Ambos validam a assinatura e populam `c.Locals("branch_id")`, `c.Locals("user_id")` e `c.Locals("role")` para os handlers usarem.

Não há refresh token — quando o JWT expira (72h), o usuário precisa fazer login novamente.

---

## Hash de senha — Argon2id

- Implementado manualmente em `auth_handler.go` (`hashPassword` / `verifyPassword`), usando `golang.org/x/crypto`.
- Parâmetros: `memory=64MB`, `iterations=3`, `parallelism=4`.
- Comparação do hash em **tempo constante**, via `crypto/subtle`, para mitigar timing attacks.
- **Por que Argon2id em vez de bcrypt:** Argon2id é a recomendação atual da OWASP para hashing de senha (vencedor da Password Hashing Competition, resistente a ataques por hardware dedicado/GPU de forma mais robusta que bcrypt para os parâmetros usados hoje).
- `scripts/genhash/main.go`: CLI standalone para gerar um hash Argon2id fora do fluxo da aplicação, usado para popular seeds/usuários manualmente.

---

## Middleware: `JWTAuth` vs `JWTAuthWS`

Ambos fazem a mesma validação de assinatura/expiração do JWT — a diferença é **de onde o token é lido**:

| Middleware | Onde lê o token | Uso |
|---|---|---|
| `JWTAuth(secret)` | Header `Authorization: Bearer <token>` | Rotas REST do dashboard |
| `JWTAuthWS(secret)` | Query string `?token=<jwt>` | `GET /ws/:branchId` |

O motivo de existir uma variante separada para WebSocket: o handshake de conexão WebSocket feito por um browser não permite enviar headers HTTP customizados, então o token precisa viajar na URL.

**Cuidado ao logar/depurar:** como o token vai na query string do WS, evite logar URLs completas de conexões WebSocket em logs persistentes (o JWT ali é sensível pelo mesmo motivo que um header `Authorization` seria).

---

## RBAC — papéis fixos (`admin` / `atendente`)

A infraestrutura de RBAC existe e está pronta para uso, mas **ainda não é aplicada a nenhuma rota**. Isso é uma escolha deliberada, não uma lacuna: as rotas atuais (`clients`, `conversations`, `appointments`) não são logicamente admin-only — qualquer usuário autenticado da filial pode acessá-las hoje. A checagem de papel só faz sentido quando existir uma rota que genuinamente deva ser restrita (ex.: gestão de usuários do dashboard, configuração de filial), e essas rotas ainda não existem.

O que já está implementado:

- Claim `role` no JWT (ver tabela acima), extraída de `dashboard_users.role` (`VARCHAR(50) DEFAULT 'admin'`, ver `migrations/0001_init.up.sql`).
- `middleware.JWTAuth` / `middleware.JWTAuthWS` populam `c.Locals("role")`.
- `middleware.RequireRole(roles ...string) fiber.Handler` (em `internal/middleware/auth.go`): middleware encadeável **depois** de `JWTAuth`, que lê `c.Locals("role")` e retorna `403 {"error": "forbidden: requires role X"}` se o papel não estiver na lista permitida.

Como aplicar a uma rota nova (quando existir uma rota admin-only):

```go
protected.Post("/branch-settings", middleware.RequireRole("admin"), d.BranchSettings.Update)
```

(`RequireRole` deve vir depois de `JWTAuth` no grupo `protected`, já que depende de `role` já estar em `c.Locals`.)

Testes: `internal/middleware/auth_test.go` cobre `RequireRole` (papel permitido, papel não permitido, papel ausente) e a extração de `role` em `JWTAuth`/`JWTAuthWS`.

**Papéis hoje:** `admin` (default de todo usuário criado até agora) e `atendente` (previsto, ainda sem uso real em nenhuma rota nem seed). Não há papéis granulares por ação — é um modelo de papéis fixos, conforme decisão de escopo.

---

## Validação do webhook do WhatsApp (HMAC)

`webhook_handler.go` (`validSignature`) valida o payload recebido em `POST /webhook` comparando a assinatura HMAC-SHA256 enviada pela Meta no header `X-Hub-Signature-256` contra um HMAC calculado localmente usando `META_APP_SECRET`.

### `META_APP_SECRET` vazio: permissivo fora de produção, bloqueia o boot em produção

Se a env `META_APP_SECRET` não estiver configurada, a validação de assinatura é **pulada** — o webhook aceita qualquer payload sem verificar a origem. Fora de produção isso continua permissivo por padrão (facilita rodar localmente sem configurar o segredo da Meta), mas agora gera um log de aviso `ℹ️` no boot.

**Em produção (`APP_ENV=production`), isso não é mais silencioso.** `internal/config/config.go` (`Config.validate`, chamado por `Load()`) faz `log.Fatal` com um `❌` explicativo e impede o boot da aplicação se `META_APP_SECRET` estiver vazio nesse ambiente — não é mais possível subir a aplicação em produção sem essa variável configurada. Testado em `internal/handlers/webhook_handler_test.go` (comportamento de `validSignature` com segredo vazio) — a checagem de fail-fast em si é lógica simples em `config.go`, validada manualmente subindo o binário com/sem a env.

---

## CORS e origem confiável

O JWT por si só não substitui CORS — a lista de origens permitidas (`ALLOWED_ORIGINS`) continua sendo a primeira barreira contra que domínios podem sequer tentar chamar a API a partir de um browser. Ver `API_GUIDE.md`.
