# Raissa Cachos — Monorepo

CRM multitenant com assets de negócio múltiplos (Landing Page, Blog, Linktree) para salões especializados em cabelos naturais.

---

## Apps

| App | Stack | Porta local | Deploy |
|---|---|---|---|
| `apps/frontend` | React 18 + TypeScript | `3000` | Cloudflare Pages (`Tyflachar`) |
| `apps/backend` | Go + Fiber | `8080` | Fly.io (`crm-whatsapp-api`) |

---

## Quick Start (desenvolvimento local)

### Pré-requisitos
- Docker Desktop (para Postgres + Redis)
- Go 1.21+
- Node.js 18+ / npm

### Subir tudo de uma vez

**Windows (PowerShell):**
```powershell
./scripts/dev.ps1
```

**Linux / macOS / WSL:**
```bash
./scripts/dev.sh
```

Isso sobe:
1. Postgres na porta `5432`
2. Redis na porta `6379`
3. Backend Go na porta `8080`
4. Frontend React na porta `3000`

---

## Estrutura

```
.
├── apps/
│   ├── frontend/          # React 18 + TypeScript (CRM multitenant)
│   └── backend/           # Go + Fiber (API REST + WhatsApp + LLM)
├── scripts/
│   ├── dev.ps1            # Sobe tudo em paralelo (Windows)
│   └── dev.sh             # Sobe tudo em paralelo (Linux/macOS/WSL)
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml   # fly deploy on push → apps/backend
│       └── deploy-frontend.yml  # wrangler pages deploy on push → apps/frontend
├── docker-compose.yml     # Postgres + Redis para dev local
└── README.md
```

---

## Deploy

### Backend (Fly.io)

Push on branch `main` with changes in `apps/backend/**` triggers the workflow automatically.

**First-time setup** (create DB + Redis):
```powershell
.\scripts\fly-setup-infra.ps1
```

**Deploy manually:**
```powershell
.\scripts\fly-deploy.ps1 deploy    # secrets + build + deploy
.\scripts\fly-deploy.ps1 secrets   # push .env secrets only
.\scripts\fly-deploy.ps1 status    # show status + secrets
.\scripts\fly-deploy.ps1 logs      # tail logs
.\scripts\fly-deploy.ps1 destroy   # destroy everything (asks confirmation)
```

### Frontend (Cloudflare Pages)

Push na branch `main` com mudanças em `apps/frontend/**` dispara o workflow automaticamente.

Manual:
```bash
cd apps/frontend
npm run build
wrangler pages deploy build --project-name=Tyflachar
```

---

## Secrets necessários no GitHub

| Secret | Used by |
|---|---|
| `FLY_API_TOKEN` | Backend deploy on Fly.io |
| `CLOUDFLARE_API_TOKEN` | Frontend deploy on Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Frontend deploy on Cloudflare Pages |
| `REACT_APP_API_URL` | Frontend build — backend REST URL (e.g. `https://crm-whatsapp-api.fly.dev`) |
| `REACT_APP_WS_URL` | Frontend build — backend WebSocket URL (e.g. `wss://crm-whatsapp-api.fly.dev`) |

---

## Documentação dos apps

- [Frontend — README](./apps/frontend/README.md)
- [Frontend — Architecture](./apps/frontend/docs/architecture/ARCHITECTURE.md)
- [Frontend — Templates Guide](./apps/frontend/docs/instructions/TEMPLATES_GUIDE.md)
- [Frontend — Clients Guide](./apps/frontend/docs/instructions/CLIENTS_GUIDE.md)
- [API Reference](./docs/API.md)
