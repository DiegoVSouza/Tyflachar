# API Reference

Base URL: `https://crm-whatsapp-api.fly.dev` (production) · `http://localhost:8080` (local)

All protected endpoints require `Authorization: Bearer <jwt>`.

---

## Auth

### `POST /api/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Raissa", "email": "...", "role": "admin" }
}
```

### `GET /api/auth/me` 🔒
```json
// Response 200
{ "id": 1, "name": "Raissa", "email": "...", "role": "admin" }
```

---

## Clients 🔒

### `GET /api/clients`
| Query | Type | Description |
|---|---|---|
| `q` | string | Name or phone search |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 30) |

```json
// Response 200
{ "items": [ { "id": 1, "name": "Maria", "phone": "+5511...", "tags": ["vip"], "created_at": "..." } ], "total": 42 }
```

### `GET /api/clients/:id`
```json
// Response 200
{ "id": 1, "branch_id": 1, "name": "Maria", "phone": "+5511...", "tags": [], "created_at": "..." }
```

### `PATCH /api/clients/:id/tags`
```json
// Request
{ "tags": ["vip", "recorrente"] }

// Response 200 — updated client object
```

### `GET /api/clients/:id/appointments`
```json
// Response 200 — array of AppointmentWithClient
[ { "id": 7, "client_name": "Maria", "service": "Cachos", "scheduled_at": "...", "status": "confirmado" } ]
```

---

## Conversations 🔒

### `GET /api/conversations`
| Query | Type | Description |
|---|---|---|
| `status` | string | `aberta` · `aguardando` · `fechada` |

```json
// Response 200
[
  {
    "id": 3,
    "client_id": 1,
    "client_name": "Maria",
    "client_phone": "+5511...",
    "status": "aberta",
    "last_message_at": "...",
    "last_message": "Oi, quero agendar",
    "unread": 2
  }
]
```

### `GET /api/conversations/:id/messages`
| Query | Type | Description |
|---|---|---|
| `page` | int | Page (default 1) |
| `limit` | int | Per page (default 50) |

```json
// Response 200
{
  "items": [
    { "id": 1, "conversation_id": 3, "direction": "in", "content": "Oi!", "type": "text", "status": "received", "timestamp": "..." }
  ],
  "total": 18
}
```

### `POST /api/conversations/:id/messages`
```json
// Request
{ "content": "Olá! Agendamento confirmado para amanhã às 14h." }

// Response 201 — Message object
```

---

## Appointments 🔒

### `GET /api/appointments`
| Query | Type | Description |
|---|---|---|
| `status` | string | `pendente` · `confirmado` · `cancelado` |
| `period` | string | `hoje` · `semana` · `mes` |

```json
// Response 200
[ { "id": 7, "client_name": "Maria", "service": "Cachos", "scheduled_at": "...", "status": "pendente" } ]
```

### `POST /api/appointments`
```json
// Request
{ "client_id": 1, "service": "Cachos", "scheduled_at": "2025-07-15T14:00:00Z" }

// Response 201 — AppointmentWithClient object
```

### `PATCH /api/appointments/:id`
```json
// Request
{ "status": "confirmado" }

// Response 200 — AppointmentWithClient object
```

---

## WebSocket

```
ws://localhost:8080/ws/:branchId?token=<jwt>
```

The JWT is validated server-side. The `branchId` must match the `branch_id` claim in the token.

### Inbound events (server → client)

```json
// New inbound message from WhatsApp
{ "type": "nova_mensagem", "payload": { "conversationId": 3, "message": { ... } } }

// New appointment booked via chatbot
{ "type": "novo_agendamento", "payload": { "id": 7, "client_name": "...", ... } }
```

---

## Error format

All errors return:
```json
{ "error": "human readable message" }
```

Common HTTP codes: `400` · `401` · `403` · `404` · `422` · `500`

---

## GitHub Secrets required

| Secret | Used by | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend CI | e.g. `https://crm-whatsapp-api.fly.dev` |
| `VITE_WS_URL` | Frontend CI | e.g. `wss://crm-whatsapp-api.fly.dev` |
| `CLOUDFLARE_API_TOKEN` | Frontend CI | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Frontend CI | Cloudflare account ID |
| `FLY_API_TOKEN` | Backend CI | Fly.io deploy token |
