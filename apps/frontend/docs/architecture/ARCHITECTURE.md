# Arquitetura

> Decisões técnicas e o raciocínio por trás delas.

---

## Visão Geral — Dois produtos, um codebase

Este codebase hospeda **dois produtos distintos**:

1. **Gerador de microsite multitenant** — modelo **multitenant baseado em configuração**: um único codebase serve múltiplos clientes (tenants/marcas), cada um com identidade visual, conteúdo e assets independentes. Rotas públicas: `/:clientSlug`, `/:clientSlug/blog`, `/:clientSlug/links`.
2. **Dashboard/CRM autenticado** — inbox de mensagens em tempo real, agendamentos e gestão de clientes do salão. Rotas protegidas: `/dashboard/inbox`, `/dashboard/appointments`, `/dashboard/clients`. Ver seção [Dashboard/CRM](#dashboardcrm) abaixo — hoje representa a maior parte do código do app.

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
├──────────────────────────────────────────────────────────────┤
│              React Router — roteamento por cliente           │
│   /:clientSlug → ClientPage resolve CLIENT_REGISTRY →        │
│   import dinâmico do config.json → decide assets ativos      │
├──────────────────────────────────────────────────────────────┤
│                  Templates (assets de negócio)               │
│   LandingPageTemplate (único template real)                  │
│   blog/linktree → placeholders <div> inline em ClientPage    │
├──────────────────────────────────────────────────────────────┤
│                     ClientConfig (JSON)                      │
│   src/clients/<slug>/config.json — única fonte de verdade    │
│   Define: tema, marca, nav, páginas, links, seções           │
├──────────────────────────────────────────────────────────────┤
│              Componentes e Hooks compartilhados              │
│   UI primitives, hooks de scroll/animation, Redux Store      │
├──────────────────────────────────────────────────────────────┤
│                     Services / API                           │
│   apiClient → domainService → backend                        │
└──────────────────────────────────────────────────────────────┘
```

> **Nota sobre nomenclatura "Client":** o termo é ambíguo neste codebase.
> - No contexto **multitenant** (produto 1), "cliente" = tenant/marca que contratou o microsite (`src/clients/<slug>/config.json`, `ClientConfig`, `ClientPage.tsx`).
> - No contexto **CRM** (produto 2), "cliente" = cliente final do salão, cadastrado no sistema (`clientSlice.ts`, `clientService.ts`, `ClientsPage.tsx`, `ClientDrawer.tsx`).
>
> São conceitos completamente diferentes que compartilham o mesmo nome. Ao ler ou escrever código/docs, confirme sempre em qual dos dois contextos um "Client"/"cliente" está sendo usado, para não confundir devs (humanos ou agentes de IA).

---

## Dashboard/CRM

A segunda metade do app é um painel autenticado para gestão do salão, montado sobre as mesmas camadas (Redux, services, hooks) descritas neste documento.

### Autenticação

- `useAuth.ts` encapsula login, logout, `refreshUser`, `clearError`, lendo de `authSlice`.
- O token JWT é persistido via `tokenStorage` (`src/services/utils/tokenStorage.ts`) e injetado automaticamente pelo `apiClient` em todo request (`Authorization: Bearer <token>`).
- `components/shared/ProtectedRoute.tsx` guarda as rotas `/dashboard/*` em `App.tsx`, redirecionando para `/login` quando não autenticado.

### Layout e rotas

- `components/layout/DashboardLayout.tsx` é o layout compartilhado (sidebar/header) das páginas do dashboard.
- Rotas registradas em `App.tsx`: `/dashboard` (redireciona para `/dashboard/inbox`), `/dashboard/inbox` (`InboxPage`), `/dashboard/appointments` (`AppointmentsPage`), `/dashboard/clients` (`ClientsPage`).

### WebSocket em tempo real

- `src/hooks/useWebSocket.ts` mantém uma conexão WebSocket viva enquanto o usuário está autenticado, com reconexão automática (backoff fixo `RECONNECT_DELAY_MS`, até `MAX_RECONNECT_ATTEMPTS = 10`).
- Decodifica o JWT (`extractBranchId`) para extrair `branch_id` e conectar em `${VITE_WS_URL}/ws/<branchId>?token=<token>`.
- Eventos recebidos (`new_message`, `new_appointment`) são despachados diretamente para `conversationSlice` (`receiveMessage`) e `appointmentSlice` (`receiveNewAppointment`) — ou seja, parte do estado chega via push do servidor, não apenas via thunks disparados pelo cliente. Esse é um padrão arquitetural relevante e não documentado anteriormente.

---

## Modelo de Dados — ClientConfig

Cada cliente possui um `config.json` com o seguinte schema:

```
ClientConfig
├── slug            ← identificador único (ex: "hairdresser")
├── meta            ← title, description, themeColor (SEO / PWA)
├── brand           ← name, logoSrc, tagline
├── theme           ← colorPrimary, colorBg, fontHeading, fontBody...
├── nav             ← links[], ctaLabel, ctaHref
├── footer          ← columns[], copyright
└── pages
    ├── landing     ← hero, philosophy, services, gallery, testimonials, newsletter
    ├── blog        ← enabled (boolean)
    └── linktree    ← links[]
```

O tipo TypeScript correspondente vive em `src/types/client.types.ts`.

---

## Fluxo de renderização de um cliente

```
1. Router detecta /:clientSlug (rota genérica fixa em App.tsx)
2. ClientPage.tsx resolve o slug no CLIENT_REGISTRY e faz import
   dinâmico de src/clients/<slug>/config.json
3. useClientTheme(config.theme) injeta as CSS custom properties do tema
   diretamente em document.documentElement.style (ver ADR-002)
   applyDocumentMeta() seta data-tenant, <title>, <meta description/theme-color>
4. Para cada asset ativo:
   - landing → <LandingPageTemplate config={config} />
   - blog    → placeholder <div> ("Blog em breve") — sem componente próprio
   - linktree→ placeholder <div> ("Linktree em breve") — sem componente próprio
```

---

## ADRs — Architectural Decision Records

### ADR-001: Config-driven rendering (sem código por cliente)

**Status:** Aceito

**Contexto:** Precisávamos atender múltiplos clientes sem duplicar código ou manter branches separadas por cliente.

**Decisão:** Cada cliente tem apenas um `config.json`. Os templates são genéricos e orientados por dados.

**Consequências:**
- ✅ Novo cliente em minutos (sem PR de código)
- ✅ Templates evoluem para todos os clientes de uma vez
- ✅ Designer pode ajustar conteúdo editando só o JSON
- ⚠️ Personalização muito específica exige extensão do schema
- ⚠️ Schema precisa ser bem documentado e validado

---

### ADR-002: Tema por tenant via injeção dinâmica de CSS custom properties

**Status:** Resolvido (2026-07-02) — anteriormente "aceito com dívida técnica" (overrides hardcoded por tenant em `tokens.css`); ver histórico abaixo.

**Contexto:** Cada cliente tem paleta e tipografia diferentes. Precisávamos de um mecanismo que não exigisse CSS Modules separados por cliente, nem edição manual de CSS compartilhado ao integrar um cliente novo.

**Decisão (mecanismo atual):** `src/hooks/useClientTheme.ts` recebe `config.theme` (tipo `ClientTheme`, `src/types/client.types.ts`) e, num `useEffect`, injeta cada variável de tema via `document.documentElement.style.setProperty('--var', valor)`. `ClientTheme` expõe um punhado de cores "de marca" (`colorPrimary`, `colorSecondary`, `colorBg`, `colorSurface`, `colorAccentWarm`) e as duas famílias de fonte (`fontHeading`, `fontBody`); o hook mapeia essas para as CSS custom properties correspondentes que `styles/tokens.css` já definia por tenant (`--bg-page`, `--brand-primary`, `--accent-warm`, `--font-heading`, etc.) e **deriva** as variáveis auxiliares que não têm campo próprio no schema (estados hover/active, glass fills, glows, texto desabilitado) a partir dessa mesma paleta base, usando pequenos helpers de mistura de cor (`lighten`/`darken`/`withAlpha`) — não são cópias exatas dos hexadecimais antigos, mas tons derivados coerentes da mesma paleta.

O `useEffect` retorna uma função de cleanup que remove (`removeProperty`) todas as CSS vars que injetou, disparada ao desmontar `ClientPage` ou quando `config.theme` muda (ex.: navegação client-side entre dois slugs de tenant diferentes) — evita que o tema de um tenant vaze para o próximo.

`src/pages/ClientPage.tsx` chama `useClientTheme(config?.theme)` e mantém `document.documentElement.setAttribute('data-tenant', slug)` separadamente (função `applyDocumentMeta`, ao lado de `<title>`/`<meta description/theme-color>`) — o atributo não carrega mais overrides de cor/fonte em CSS, mas continua disponível para eventual CSS estrutural (não-tema) específico de um tenant.

`src/styles/tokens.css` não tem mais blocos `[data-tenant='<slug>']` hardcoded. As Camadas 1 (primitivos) e 2 (semânticos default) continuam lá como fallback — usadas antes do JS rodar, ou para qualquer campo de tema ausente num `config.json` futuro.

**Consequências:**
- ✅ Onboardar um cliente novo não exige mais tocar em `tokens.css` — só criar `config.json` com um bloco `theme` (ADR-001 volta a valer sem ressalvas)
- ✅ Troca de tema em runtime sem recarregar a página
- ✅ Templates continuam agnósticos de cliente — consomem apenas CSS variables
- ✅ Cleanup explícito evita vazamento de tema entre tenants em navegação client-side
- ⚠️ `ClientTheme` só expõe as cores "de marca" principais; variáveis derivadas (hover/active/glass/glow) são aproximações calculadas, não valores artesanais pixel-a-pixel — se um tenant precisar de controle fino sobre essas variáveis, o schema de `ClientTheme` precisará crescer
- ⚠️ Validado com `npm run build` + inspeção manual; sem Playwright/Puppeteer no projeto, não houve verificação visual automatizada pixel-a-pixel do tenant `hairdresser` pós-migração (ver `docs/gsd/STATE.md`)

---

### ADR-003: Fetch nativo em vez de Axios

**Status:** Aceito

**Decisão:** Usar `fetch` nativo com wrapper customizado (`apiClient`).

**Consequências:**
- ✅ Zero dependências para HTTP
- ✅ Bundle menor
- ⚠️ Cancelamento de requests requer `AbortController` manual

---

### ADR-004: Redux Toolkit para estado compartilhado

**Status:** Aceito

**Decisão:** RTK para estado global (auth, UI state compartilhado, dados do CRM). Estado local permanece em `useState`.

**Regra:** Use Redux apenas para estado **compartilhado entre rotas**. Estado de componente fica em `useState`.

**Slices reais registrados em `src/store/index.ts`** (6 no total):

| Slice | Domínio |
|---|---|
| `auth` | Autenticação — usuário logado, JWT, loading/error |
| `ui` | Estado de UI compartilhado (toasts, etc.) |
| `users` | Usuários do CRM |
| `conversation` | Conversas/mensagens do Inbox (inclui eventos recebidos via WebSocket) |
| `appointment` | Agendamentos (inclui eventos recebidos via WebSocket) |
| `client` | Clientes do salão (CRM) — não confundir com o `ClientConfig` do produto multitenant |

Ver `docs/instructions/REDUX_GUIDE.md` para detalhes de cada slice.

---

### ADR-005: TypeScript com ClientConfig tipado

**Status:** Aceito

**Contexto:** O schema do `config.json` precisa ser contrato explícito para evitar erros em runtime ao acessar campos inexistentes.

**Decisão:** Interface `ClientConfig` em `src/types/client.types.ts` como única fonte de verdade de tipagem.

**Consequências:**
- ✅ Autocompletar no editor ao criar config de novo cliente
- ✅ Erro de compilação se campo obrigatório faltar
- ⚠️ Schema precisa evoluir junto com novos templates

---

## Camadas e Responsabilidades

### Templates (`templates/`)
- Renderizam um asset completo para um cliente
- Recebem `config: ClientConfig` como única prop
- **Proibido:** lógica de negócio, chamadas de API diretas

### UI Layer (`components/`, `pages/`)
- Renderiza primitivos e composições reutilizáveis
- **Proibido:** chamadas de API diretas, lógica de negócio complexa

### Logic Layer (`hooks/`)
- Conecta Store e Services
- Encapsula lógica de UI (loading, error, empty)
- **Proibido:** JSX, manipulação do DOM

### State Layer (`store/`)
- Gerencia estado compartilhado entre rotas
- Reducers são funções puras
- **Proibido:** side effects no reducer

### Data Layer (`services/`)
- Fala com o mundo externo
- Normaliza respostas da API
- **Proibido:** estado React, lógica de UI

---

## Padrão de Error Handling

```
Service  →  lança Error com mensagem legível
Slice    →  captura no `rejected` do thunk, armazena em `error`
Hook     →  expõe `error` para o componente
Template → renderiza mensagem de erro para o usuário
```

Nunca engula erros silenciosamente.
