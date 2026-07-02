# Data Flow

> Como os dados fluem através do sistema nos dois fluxos mais importantes do backend: mensagem do WhatsApp e login do dashboard.

---

## Fluxo 1 — Mensagem recebida do WhatsApp (webhook → resposta → tempo real)

```
1. WhatsApp Cloud API (Meta)
        │  POST /webhook  (payload da mensagem do cliente)
        ▼
2. middleware.WebhookRateLimit()
        │  limita a 60 req/min nesta rota
        ▼
3. WebhookHandler.ReceiveWebhook
        │  valida assinatura HMAC-SHA256 (header X-Hub-Signature-256
        │  contra META_APP_SECRET) — ver AUTH_GUIDE.md para o
        │  comportamento quando META_APP_SECRET está vazio
        ▼
4. repository — grava a mensagem recebida (INSERT em messages,
   direction = "in"), grava/atualiza o client e a conversation
        ▼
5. WebhookHandler.engine(branchID)
        │  escolhe o motor conforme branches.bot_mode
        ├── "fixed" → chatbot.Engine (máquina de estados)
        └── "llm"   → chatbot.LLMEngine (RAG + tool calling)
        ▼
6. Engine decide a próxima resposta
        │  fixed: avança o bot_state salvo em conversations.bot_state
        │  llm:   busca contexto em branch_knowledge (RAG),
        │         eventualmente chama tools (list_services,
        │         search_available_slots, create_appointment)
        ▼
7. whatsapp.Client (internal/whatsapp/client.go)
        │  SendText / SendButtons / SendList via Graph API da Meta
        ▼
8. repository — grava a mensagem enviada (INSERT em messages,
   direction = "out")
        ▼
9. redisclient.Publisher
        │  publica evento (ex.: new_message) no canal Redis
        │  branch:<id>:events
        ▼
10. cmd/server/main.go
        │  PSubscribe("branch:*:events") recebe o evento em
        │  toda instância do backend rodando
        ▼
11. ws.Hub.BroadcastJSON(branchId, evento)
        │  envia para todas as conexões WebSocket daquela
        │  filial conectadas àquela instância
        ▼
12. Frontend (dashboard)
        recebe o evento via WebSocket (/ws/:branchId?token=<jwt>)
        e atualiza a UI em tempo real (nova mensagem na conversa)
```

**Pontos de atenção:**
- Se `create_appointment` for chamado pelo `LLMEngine` (ou o fluxo `fixed` chegar em `confirming_appointment`), o mesmo mecanismo de publish/broadcast é usado para o evento `new_appointment`.
- A validação HMAC (passo 3) roda **antes** de qualquer gravação em banco — payloads não assinados corretamente (quando `META_APP_SECRET` está configurado) são rejeitados sem tocar o banco.
- Erros em qualquer etapa (ex.: falha ao enviar via Graph API) são logados com o prefixo emoji (`❌`) mas não interrompem necessariamente o fluxo de gravação — ver `instructions/CHATBOT_GUIDE.md` e `CONTRIBUTING.md` para o padrão de logging.

---

## Fluxo 2 — Login no dashboard e uso do JWT

```
1. Frontend
        │  POST /api/auth/login  { email, password }
        ▼
2. AuthHandler.Login (internal/handlers/auth_handler.go)
        │  busca dashboard_users por email (repository)
        ▼
3. verifyPassword(senha_informada, password_hash)
        │  Argon2id, comparação em tempo constante via crypto/subtle
        ▼
4. Se válido → gera JWT (HS256, golang-jwt/jwt/v5)
        │  claims: user_id, branch_id, exp (72h a partir de agora)
        │  assinado com JWT_SECRET
        ▼
5. Resposta 200 com { token, user }
        ▼
6. Frontend guarda o token e o usa em dois lugares:
        │
        ├── Requisições REST subsequentes:
        │     header Authorization: Bearer <token>
        │     → middleware.JWTAuth(secret) valida e popula
        │       c.Locals("branch_id") / c.Locals("user_id")
        │
        └── Conexão WebSocket:
              GET /ws/:branchId?token=<jwt>
              → middleware.JWTAuthWS(secret) lê o token da
                query string (handshake de WS do browser não
                permite headers customizados)
```

**Por que dois middlewares de auth (`JWTAuth` e `JWTAuthWS`)?** A validação do JWT é a mesma nos dois casos — a diferença é só de onde o token é lido (header `Authorization` vs query string `?token=`). Ver `instructions/AUTH_GUIDE.md` para detalhes.

**Toda a autorização multi-tenant depende do `branch_id` do JWT.** Não há verificação adicional de papel/role nas rotas atuais — ver a lacuna de RBAC documentada em `instructions/AUTH_GUIDE.md` e `planning/PLANNING.md`.
