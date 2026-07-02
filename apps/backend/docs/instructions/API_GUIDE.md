# API Guide

> Referência das rotas HTTP expostas pelo backend (`internal/routes/routes.go`), convenções de request/response e autenticação.

---

## Base

Todas as rotas de negócio ficam sob o prefixo `/api`, exceto o webhook do WhatsApp (`/webhook`) e o WebSocket (`/ws/:branchId`).

Rotas autenticadas ficam agrupadas em `api.Group("", middleware.JWTAuth(secret))` — qualquer rota nova que precise de autenticação deve ser registrada dentro desse grupo.

---

## Tabela de rotas

| Método | Path | Auth | Handler | Descrição |
|---|---|---|---|---|
| GET | `/webhook` | público | `WebhookHandler.VerifyWebhook` | Handshake de verificação exigido pela Meta (`hub.challenge`) |
| POST | `/webhook` | público + rate limit 60/min | `WebhookHandler.ReceiveWebhook` | Recebe eventos de mensagem do WhatsApp Cloud API |
| POST | `/api/auth/login` | público | `AuthHandler.Login` | Autentica e retorna JWT |
| GET | `/api/auth/me` | JWT | `AuthHandler.GetMe` | Retorna o usuário autenticado |
| GET | `/api/clients` | JWT | `ClientHandler.List` | Lista clientes da filial (`?q=&page=&limit=`) |
| GET | `/api/clients/:id` | JWT | `ClientHandler.GetByID` | Detalhe de um cliente |
| PATCH | `/api/clients/:id/tags` | JWT | `ClientHandler.UpdateTags` | Atualiza tags de um cliente |
| GET | `/api/clients/:id/appointments` | JWT | `ClientHandler.GetAppointments` | Agendamentos de um cliente |
| GET | `/api/conversations` | JWT | `ConversationHandler.List` | Lista conversas (`?status=`) |
| GET | `/api/conversations/:id/messages` | JWT | `ConversationHandler.GetMessages` | Mensagens de uma conversa (`?page=&limit=`) |
| POST | `/api/conversations/:id/messages` | JWT | `ConversationHandler.SendMessage` | Envia mensagem manual pelo dashboard |
| GET | `/api/appointments` | JWT | `AppointmentHandler.List` | Lista agendamentos (`?status=&period=`) |
| POST | `/api/appointments` | JWT | `AppointmentHandler.Create` | Cria agendamento |
| PATCH | `/api/appointments/:id` | JWT | `AppointmentHandler.Update` | Atualiza status/dados de um agendamento |
| GET | `/ws/:branchId?token=<jwt>` | JWT via query | `WebSocketUpgrade` | Canal WebSocket de eventos em tempo real da filial |

---

## Autenticação

Duas formas de passar o JWT, dependendo do transporte:

- **REST:** header `Authorization: Bearer <token>`, validado por `middleware.JWTAuth`.
- **WebSocket:** query string `?token=<jwt>`, validado por `middleware.JWTAuthWS` — necessário porque o handshake de WebSocket feito pelo browser não permite enviar headers customizados.

Em ambos os casos, o middleware popula `c.Locals("branch_id")` e `c.Locals("user_id")`, que os handlers usam para filtrar dados por filial. Ver `AUTH_GUIDE.md` para detalhes de claims e expiração.

---

## Paginação

Rotas de listagem aceitam `?page=` e `?limit=` como query params (ex.: `GET /api/clients?page=2&limit=20`). Não há um envelope de paginação padronizado documentado em código (sem metadados tipo `total`/`totalPages` centralizados) — cada handler de listagem implementa sua própria query paginada via `LIMIT`/`OFFSET` no repository. Ao consumir a API, trate a paginação por handler, não assuma um contrato único entre todos os endpoints de listagem sem checar o handler específico.

Filtros adicionais por rota:
- `GET /api/clients` — `?q=` (busca textual)
- `GET /api/conversations` — `?status=`
- `GET /api/appointments` — `?status=&period=`

---

## Formato de resposta de erro

Não há middleware global de tratamento de erro — o projeto usa o handler de erro padrão do Fiber. Cada handler retorna manualmente:

```json
{ "error": "mensagem legível do problema" }
```

com o status HTTP apropriado:

| Status | Quando |
|---|---|
| 400 | Corpo/parâmetros malformados |
| 401 | Token ausente, inválido ou expirado |
| 404 | Recurso não encontrado (ex.: cliente/conversa/agendamento inexistente) |
| 422 | Validação de negócio falhou (ex.: campo obrigatório ausente) |
| 500 | Erro inesperado (falha de banco, etc.) |

Como não há um wrapper de erro central, o corpo de erro pode variar levemente de handler para handler — ao integrar um novo endpoint, siga o padrão `{"error": "..."}` já usado pelos handlers vizinhos.

---

## Rate limiting

Aplicado apenas em `POST /webhook`, via `middleware.WebhookRateLimit()` (`fiber/middleware/limiter`), limitando a **60 requisições por minuto**. As demais rotas (dashboard) não têm rate limiting configurado hoje.

---

## CORS

Configurado em `routes.Setup` via `fiber/middleware/cors`. As origens permitidas vêm da env `ALLOWED_ORIGINS` (CSV), lida em `internal/config/config.go`. Para liberar um novo domínio de frontend, adicione-o a essa variável de ambiente — não há lista hardcoded no código.

---

## Nil-safety em listas

Handlers de listagem garantem manualmente que campos de array nunca voltem como `null` no JSON (ex.: `if clients == nil { clients = []models.Client{} }`), retornando `[]` em vez de `null` quando não há resultados. Ao escrever um novo handler de listagem, replique esse padrão.
