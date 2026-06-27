# Templates Guide

> Como criar, usar e estender os templates de assets de negócio.

---

## O que é um Template?

Um template é um componente React **genérico e orientado por dados** que representa um asset de negócio completo (landing page, blog, linktree). Ele recebe um `ClientConfig` como única prop e renderiza todo o asset usando apenas os dados dessa config.

```
<LandingPageTemplate config={clientConfig} />
```

Nenhum dado fica hardcoded no template. Tudo vem do `config.json` do cliente.

---

## Templates disponíveis

| Template | Caminho | Status |
|---|---|---|
| `LandingPageTemplate` | `src/templates/LandingPageTemplate/` | ✅ Ativo |
| `BlogTemplate` | `src/templates/BlogTemplate/` | 🚧 Em construção |
| `LinktreeTemplate` | `src/templates/LinktreeTemplate/` | 🚧 Em construção |

---

## LandingPageTemplate

O template mais completo. Orquestra as seguintes seções:

| Seção | Arquivo | Dados consumidos |
|---|---|---|
| Navegação | `NavSection.tsx` | `config.nav`, `config.brand` |
| Hero | `HeroSection.tsx` | `config.pages.landing.hero` |
| Filosofia/Sobre | `PhilosophySection.tsx` | `config.pages.landing.philosophy` |
| Serviços | `ServicesSection.tsx` | `config.pages.landing.services` |
| Galeria | `GallerySection.tsx` | `config.pages.landing.gallery` |
| Depoimentos | `TestimonialSection.tsx` | `config.pages.landing.testimonials` |
| Newsletter | `NewsletterSection.tsx` | `config.pages.landing.newsletter` |
| Footer | `FooterSection.tsx` | `config.footer`, `config.brand` |

### Comportamentos built-in

- **Nav shrink no scroll** — a navbar reduz ao rolar a página (via `IntersectionObserver` no `navRef`)
- **Fade-in ao entrar na viewport** — elementos com classe `fadeIn` animam ao aparecer

### Estrutura de arquivos

```
LandingPageTemplate/
├── index.tsx                  ← orquestrador principal
├── LandingPage.module.css     ← estilos do template (usa CSS vars do tema)
└── sections/
    ├── NavSection.tsx
    ├── HeroSection.tsx
    ├── PhilosophySection.tsx
    ├── ServicesSection.tsx
    ├── GallerySection.tsx
    ├── TestimonialSection.tsx
    ├── NewsletterSection.tsx
    └── FooterSection.tsx
```

---

## Como criar um novo Template

### 1. Crie a pasta

```
src/templates/MeuNovoTemplate/
├── index.tsx
└── MeuNovoTemplate.module.css
```

### 2. Implemente o componente

```tsx
// src/templates/MeuNovoTemplate/index.tsx
import React from 'react';
import { ClientConfig } from 'types/client.types';
import styles from './MeuNovoTemplate.module.css';

interface MeuNovoTemplateProps {
  config: ClientConfig;
}

export function MeuNovoTemplate({ config }: MeuNovoTemplateProps) {
  const { brand, pages } = config;

  return (
    <main className={styles.root}>
      <h1>{brand.name}</h1>
      {/* ... renderize usando config.pages.meuAsset ... */}
    </main>
  );
}
```

**Regras:**
- Receba apenas `config: ClientConfig` como prop
- Use sempre CSS variables (`var(--color-primary)`) — nunca valores hardcoded
- Nunca faça chamadas de API diretamente no template

### 3. Adicione a chave no schema

Em `src/types/client.types.ts`, adicione o tipo dos dados do novo asset dentro de `pages`:

```ts
pages: {
  landing?: LandingPageConfig;
  blog?: { enabled: boolean };
  linktree?: LinktreeConfig;
  meuAsset?: MeuAssetConfig; // ← adicione aqui
};
```

### 4. Ative no config do cliente

```json
// src/clients/<slug>/config.json
{
  "pages": {
    "meuAsset": {
      // dados do asset
    }
  }
}
```

### 5. Registre a rota em App.tsx

```tsx
// src/App.tsx
{config.pages.meuAsset && (
  <Route path="/:slug/meu-asset" element={<MeuNovoTemplate config={config} />} />
)}
```

---

## Como adicionar uma nova Seção a um Template existente

1. Crie o arquivo da seção em `sections/MinhaSecao.tsx`
2. A seção recebe apenas o fragmento de config que ela precisa:
   ```tsx
   interface MinhaSecaoProps {
     config: LandingPageConfig['minhaSecao'];
   }
   ```
3. Importe e use no `index.tsx` do template
4. Adicione o campo correspondente no `config.json` do cliente

---

## Checklist para novo Template

- [ ] Componente em `src/templates/<NomeTemplate>/index.tsx`
- [ ] Recebe apenas `config: ClientConfig` como prop
- [ ] CSS Module usa apenas CSS variables (sem cores/fontes hardcoded)
- [ ] Tipo adicionado em `client.types.ts`
- [ ] Chave adicionada no `config.json` do cliente de teste
- [ ] Rota registrada em `App.tsx`
- [ ] Entrada adicionada neste guia (tabela de templates disponíveis)
