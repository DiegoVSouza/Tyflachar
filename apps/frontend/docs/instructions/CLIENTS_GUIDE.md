# Clients Guide

> Como configurar um novo cliente via `config.json`, sem tocar em código.

---

## Conceito

Cada cliente do sistema é representado por uma pasta em `src/clients/` contendo um único arquivo `config.json`. Esse arquivo é a **única fonte de verdade** para identidade visual, conteúdo e assets ativos daquele cliente.

```
src/clients/
└── hairdresser/
    └── config.json
```

Assets visuais (logo, imagens) ficam em:

```
public/clients/
└── hairdresser/
    ├── logo.svg
    └── images/
        ├── hero.jpg
        ├── gallery-01.jpg
        └── ...
```

---

## Schema completo do config.json

```jsonc
{
  // Identificador único do cliente (usado na URL e para carregar assets)
  "slug": "hairdresser",

  // SEO e metadados da página
  "meta": {
    "title": "Nome do Cliente | Tagline",
    "description": "Descrição para mecanismos de busca.",
    "themeColor": "#0d0803"   // cor da barra do navegador mobile
  },

  // Identidade da marca
  "brand": {
    "name": "Nome do Cliente",
    "logoSrc": "/clients/<slug>/logo.svg",
    "tagline": "Frase curta de posicionamento."
  },

  // Tokens de tema (injetados como CSS variables no :root)
  "theme": {
    "colorPrimary": "#c9a87c",
    "colorSecondary": "#e8d5b0",
    "colorBg": "#0d0803",
    "colorSurface": "#140e06",
    "colorAccentWarm": "#c9a87c",
    "fontHeading": "Cormorant Garamond",  // nome exato no Google Fonts
    "fontBody": "Inter"
  },

  // Navegação principal
  "nav": {
    "links": [
      { "label": "Texto do link", "href": "#ancora-ou-/rota" }
    ],
    "ctaLabel": "Texto do botão principal",
    "ctaHref": "#ancora-ou-/rota"
  },

  // Rodapé
  "footer": {
    "columns": [
      {
        "title": "Título da coluna",
        "links": [
          { "label": "Link", "href": "#ancora-ou-url" }
        ]
      }
    ],
    "copyright": "© 2024 Nome do Cliente. Todos os direitos reservados."
  },

  // Assets de negócio ativos para este cliente
  "pages": {

    // Landing Page
    "landing": {
      "hero": {
        "imageSrc": "/clients/<slug>/images/hero.jpg",
        "headline": "Título principal",
        "headlineEm": "Destaque em itálico",
        "subtext": "Parágrafo de apoio",
        "ctaPrimary": "Texto do CTA primário",
        "ctaSecondary": "Texto do CTA secundário"
      },
      "philosophy": {
        "eyebrow": "Label acima do título",
        "imageSrc": "/clients/<slug>/images/gallery-01.jpg",
        "imageAlt": "Descrição da imagem",
        "quote": "Citação em destaque.",
        "titleLine1": "Primeira linha do título",
        "titleEm": "Palavra em destaque",
        "paragraphs": ["Parágrafo 1.", "Parágrafo 2."],
        "historyLinkLabel": "NOSSA HISTÓRIA"
      },
      "services": {
        "eyebrow": "Label acima",
        "title": "Título da seção",
        "items": [
          {
            "icon": "cut",       // nome do ícone (Material Icons)
            "title": "Nome do serviço",
            "desc": "Descrição curta.",
            "price": "A PARTIR DE R$ 000"
          }
        ]
      },
      "gallery": {
        "eyebrow": "Galeria",
        "title": "Título da galeria",
        "instagramLabel": "Ver Instagram",
        "items": [
          {
            "src": "/clients/<slug>/images/gallery-02.jpg",
            "alt": "Descrição",
            "span": "large"   // "large" | "small" | "tall"
          }
        ]
      },
      "testimonials": {
        "eyebrow": "Depoimentos",
        "items": [
          {
            "quote": "Texto do depoimento.",
            "author": "Nome, Contexto"
          }
        ]
      },
      "newsletter": {
        "title": "Título do bloco",
        "subtitle": "Subtítulo",
        "placeholder": "SEU MELHOR E-MAIL",
        "buttonLabel": "Inscrever"
      }
    },

    // Blog (true/false)
    "blog": {
      "enabled": true
    },

    // Linktree — hub de links rápidos
    "linktree": {
      "links": [
        {
          "label": "Agendar",
          "url": "#ancora-ou-url",
          "icon": "calendar"   // "calendar" | "instagram" | "whatsapp" | "link"
        }
      ]
    }

  }
}
```

---

## Clientes cadastrados

| Slug | Negócio | Assets ativos |
|---|---|---|
| `hairdresser` | Salão especializado em cachos naturais (Raissa Cachos) | Landing Page, Blog, Linktree |

---

## Como adicionar um novo cliente

### 1. Crie a pasta de config

```
src/clients/<slug>/
└── config.json
```

Copie o `config.json` do cliente `hairdresser` como ponto de partida e substitua os valores.

### 2. Adicione os assets visuais

```
public/clients/<slug>/
├── logo.svg
└── images/
    ├── hero.jpg
    └── gallery-01.jpg
    └── ...
```

Recomendado:
- Logo: SVG ou PNG com fundo transparente
- Hero: 1600×900px mínimo
- Galeria: 800×800px ou superior, JPG/WebP

### 3. Registre a rota

Em `src/App.tsx`, adicione o import da config e a rota do cliente:

```tsx
import hairdresserConfig from './clients/hairdresser/config.json';
// import novoClienteConfig from './clients/<slug>/config.json';

// Na árvore de rotas:
<Route path="/hairdresser/*" element={<ClientRoutes config={hairdresserConfig} />} />
// <Route path="/<slug>/*" element={<ClientRoutes config={novoClienteConfig} />} />
```

### 4. Valide

- [ ] A rota `/<slug>` renderiza a landing page
- [ ] A rota `/<slug>/blog` está disponível (se `blog.enabled: true`)
- [ ] A rota `/<slug>/links` mostra o linktree (se `linktree.links` está preenchido)
- [ ] O tema visual (cores, fontes) está correto no browser
- [ ] As imagens carregam sem 404

---

## Regras de configuração

- **Nunca hardcode** cores, fontes ou textos de cliente nos templates — tudo via `config.json`
- **Slugs são imutáveis** após o cliente estar em produção (afeta URLs)
- **Fontes do Google Fonts** precisam ser carregadas no `public/index.html` além de declaradas no `theme`
- **Imagens** devem estar em `public/` (não em `src/`) para serem servidas como assets estáticos

---

## Validação de schema

O schema é validado pelo TypeScript via `src/types/client.types.ts`. Se o seu `config.json` tiver um campo obrigatório faltando, o build falhará com erro de tipagem.

Para checar sem buildar:

```bash
npx tsc --noEmit
```
