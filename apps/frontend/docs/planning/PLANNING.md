# Planning

> Roadmap vivo do projeto. Atualize a cada sprint.

---

## Status Atual

**Sprint:** 1 — Templates e configuração por cliente
**Responsável:** _preencha_

---

## Backlog

### 🔴 Crítico (bloqueia outros)

- [ ] Validação de schema do `config.json` em tempo de build (`zod` ou checagem TypeScript estrita)
- [ ] Roteamento dinâmico por cliente em `App.tsx`
- [ ] Definir contratos de API com backend (agendamentos, leads, newsletter)

### 🟡 Alta prioridade

- [ ] Finalizar `BlogTemplate` (estrutura de posts, listagem e detalhe)
- [ ] Finalizar `LinktreeTemplate` (hub de links com ícones)
- [ ] Adicionar suporte a múltiplos idiomas no `config.json` (pt-BR / en)
- [ ] Implementar injeção de CSS variables do tema no `:root` via `useClientTheme` hook

### 🟢 Normal

- [ ] Documentar todos os ícones disponíveis para `services.items[].icon`
- [ ] Página de erro 404 por cliente (respeitando o tema do cliente)
- [ ] Preview mode — renderizar config antes de publicar
- [ ] Otimizar imagens (lazy loading, WebP automático)

### ⚪ Futura / Nice-to-have

- [ ] CMS integrado — editar `config.json` via painel admin sem mexer em arquivos
- [ ] A/B testing por seção de landing page
- [ ] PWA / offline support
- [ ] Analytics por cliente (eventos de CTA, newsletter, galeria)

---

## Sprints

### Sprint 0 — Setup inicial ✅

| Task | Status |
|---|---|
| Criar estrutura de pastas (`clients/`, `templates/`, `types/`) | ✅ Feito |
| Configurar Redux Toolkit | ✅ Feito |
| Configurar API service layer | ✅ Feito |
| Criar `ClientConfig` TypeScript types | ✅ Feito |
| Documentar padrões base | ✅ Feito |

### Sprint 1 — Templates e clientes (atual)

| Task | Status | Responsável |
|---|---|---|
| `LandingPageTemplate` com todas as seções | ✅ Feito | — |
| `config.json` do cliente `hairdresser` | ✅ Feito | — |
| `BlogTemplate` (estrutura base) | 🔲 A fazer | — |
| `LinktreeTemplate` (estrutura base) | 🔲 A fazer | — |
| Hook `useClientTheme` para injetar CSS vars | 🔲 A fazer | — |
| Roteamento dinâmico por slug | 🔲 A fazer | — |

### Sprint 2 — _a definir_

| Task | Status | Responsável |
|---|---|---|
| _adicione aqui_ | 🔲 A fazer | — |

---

## Decisões pendentes

- [ ] Como será o backend de agendamentos? (próprio vs. integração com Calendly/etc.)
- [ ] Newsletter: Mailchimp, Brevo ou endpoint próprio?
- [ ] O roteamento por cliente será por subdomínio (`hairdresser.dominio.com`) ou por path (`dominio.com/hairdresser`)?
- [ ] Quem edita o `config.json` em produção — dev ou o próprio cliente via painel?

---

## Marcos

| Marco | Data alvo | Status |
|---|---|---|
| `LandingPageTemplate` funcional com cliente `hairdresser` | — | ✅ |
| Todos os 3 templates ativos (`Landing`, `Blog`, `Linktree`) | — | 🔲 |
| Segundo cliente cadastrado e funcionando | — | 🔲 |
| Deploy em produção com domínio próprio | — | 🔲 |

---

## Como atualizar este documento

1. A cada início de sprint: adicione uma nova seção de sprint
2. A cada task concluída: marque com ✅
3. Semanalmente: revise o backlog e repriorize se necessário
