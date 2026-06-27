# Arquitetura

> Decisões técnicas e o raciocínio por trás delas.

---

## Visão Geral — Modelo Multitenant

O sistema opera em um modelo **multitenant baseado em configuração**: um único codebase serve múltiplos clientes, cada um com identidade visual, conteúdo e assets independentes.

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
├──────────────────────────────────────────────────────────────┤
│              React Router — roteamento por cliente           │
│   /:clientSlug → carrega config.json → decide assets ativos  │
├──────────────────────────────────────────────────────────────┤
│                  Templates (assets de negócio)               │
│   LandingPageTemplate │ BlogTemplate │ LinktreeTemplate       │
│   Cada template recebe ClientConfig e renderiza por ele      │
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
1. Router detecta /:clientSlug
2. Importa src/clients/<slug>/config.json
3. Injeta CSS variables do tema (colorPrimary, fontHeading...)
4. Para cada asset ativo:
   - landing → <LandingPageTemplate config={config} />
   - blog    → <BlogTemplate config={config} />
   - linktree→ <LinktreeTemplate config={config} />
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

### ADR-002: CSS Variables injetadas pelo tema do cliente

**Status:** Aceito

**Contexto:** Cada cliente tem paleta e tipografia diferentes. Precisávamos de um mecanismo que não exigisse CSS Modules separados por cliente.

**Decisão:** Ao montar o cliente, o sistema injeta no `:root` as variáveis do `theme` do `config.json` (`--color-primary`, `--font-heading` etc.). Os templates consomem só variáveis — nunca valores hardcoded.

**Consequências:**
- ✅ Troca de tema em runtime sem recarregar a página
- ✅ Templates agnósticos de cliente
- ⚠️ Variáveis devem ter fallback para não quebrar em config incompleta

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

**Decisão:** RTK para estado global (cliente ativo, auth, UI state compartilhado). Estado local permanece em `useState`.

**Regra:** Use Redux apenas para estado **compartilhado entre rotas**. Estado de componente fica em `useState`.

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
