# CRM Multitenant — Assets de Negócio

> Frontend React para gerenciar múltiplos clientes, cada um com seus próprios assets de negócio (Landing Page, Blog, Linktree) configurados via JSON, sem tocar em código.

---

## O que é este projeto?

Uma plataforma CRM multitenant onde cada **cliente** tem um `config.json` que define toda a sua identidade visual, conteúdo e comportamento. O frontend lê essa configuração e monta automaticamente os assets de negócio disponíveis para aquele cliente:

| Asset | Descrição |
|---|---|
| **Landing Page** | Site institucional com hero, serviços, galeria, depoimentos e newsletter |
| **Blog** | Canal de conteúdo do cliente |
| **Linktree** | Hub de links rápidos (Instagram, WhatsApp, agendamento etc.) |

Adicionar um novo cliente = criar um `config.json`. Nenhum código novo é necessário.

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18 + TypeScript |
| Estado global | Redux Toolkit |
| Roteamento | React Router v6 |
| Estilo | CSS Modules + CSS Variables |
| HTTP | Fetch nativo (sem Axios) |
| Tipagem | TypeScript (`ClientConfig`) |

---

## Estrutura do Projeto

```
src/
├── clients/                  # Configuração por cliente
│   └── hairdresser/
│       └── config.json       # Identidade, tema, conteúdo do cliente
├── templates/                # Templates de assets de negócio
│   ├── LandingPageTemplate/  # Landing page genérica
│   │   ├── index.tsx         # Orquestra as seções via ClientConfig
│   │   ├── LandingPage.module.css
│   │   └── sections/         # NavSection, HeroSection, ServicesSection...
│   ├── BlogTemplate/         # Template de blog (em construção)
│   └── LinktreeTemplate/     # Template de linktree (em construção)
├── components/               # Componentes reutilizáveis entre templates
│   ├── ui/                   # Átomos: Button, Input, Modal...
│   ├── layout/               # Shell: Header, Footer...
│   └── shared/               # Organismos: Form, Card...
├── pages/                    # Roteamento por cliente/asset
├── store/                    # Redux: slices + middleware
├── hooks/                    # Custom hooks reutilizáveis
├── services/                 # Camada de dados (API)
├── types/                    # Contratos TypeScript (ClientConfig etc.)
├── styles/                   # Tokens globais de design
└── utils/                    # Funções puras utilitárias
```

---

## Como adicionar um novo cliente

1. Crie a pasta `src/clients/<slug-do-cliente>/`
2. Crie o arquivo `config.json` seguindo o schema de `ClientConfig`
3. Adicione os assets (logo, imagens) em `public/clients/<slug-do-cliente>/`
4. Registre a rota do cliente em `src/App.tsx`

Nenhum template precisa ser alterado.

---

## Como adicionar um novo template

1. Crie a pasta `src/templates/<NomeTemplate>/`
2. Implemente o componente `index.tsx` recebendo `config: ClientConfig`
3. Adicione a chave correspondente no schema `ClientConfig` (em `src/types/`)
4. Ative via `config.json` do cliente que vai usar

---

## Quick Start

```bash
npm install
npm start
```

O projeto sobe em `http://localhost:3000`.

---

## Documentação

| Doc | Descrição |
|---|---|
| [Architecture](./docs/architecture/ARCHITECTURE.md) | Decisões técnicas, ADRs e modelo multitenant |
| [Templates Guide](./docs/instructions/TEMPLATES_GUIDE.md) | Como criar e estender templates |
| [Clients Guide](./docs/instructions/CLIENTS_GUIDE.md) | Como configurar um novo cliente via JSON |
| [API Guide](./docs/instructions/API_GUIDE.md) | Como usar o service layer |
| [Redux Guide](./docs/instructions/REDUX_GUIDE.md) | Padrão de slices e actions |
| [Hooks Guide](./docs/instructions/HOOKS_GUIDE.md) | Hooks disponíveis e como criar |
| [Contributing](./docs/instructions/CONTRIBUTING.md) | Convenções e padrões do time |
| [Planning](./docs/planning/PLANNING.md) | Roadmap e backlog |

---

## Clientes cadastrados

| Slug | Negócio | Assets ativos |
|---|---|---|
| `hairdresser` | Salão especializado em cachos naturais | Landing Page, Blog, Linktree |
