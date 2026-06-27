/* ─────────────────────────────────────────────────────────────
 * ClientPage.tsx
 * Roteador dinâmico por slug de cliente.
 *
 * Como funciona:
 * 1. Lê o :clientSlug da URL
 * 2. Carrega o config.json do cliente via import dinâmico
 * 3. Injeta o tema via CSS custom properties no <html>
 * 4. Renderiza o template correto (landing / blog / linktree)
 *
 * Para adicionar um novo cliente:
 *   - Criar src/clients/<slug>/config.json
 *   - Registrar o slug no CLIENT_REGISTRY abaixo
 *   - Colocar as imagens em public/clients/<slug>/images/
 * ───────────────────────────────────────────────────────────── */
import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ClientConfig } from 'types/client.types';
import { LandingPageTemplate } from 'templates/LandingPageTemplate';

/* ── Registry de clientes disponíveis ────────────────────── */
type PageType = 'landing' | 'blog' | 'linktree';

/**
 * Mapa de slug → import dinâmico do config.
 * Ao adicionar um novo cliente, adicione uma entrada aqui.
 * Usamos um mapa estático porque bundlers (webpack/vite) precisam
 * de strings literais para tree-shaking e code-splitting correto.
 */
const CLIENT_REGISTRY: Record<string, () => Promise<{ default: ClientConfig }>> = {
  hairdresser: () => import('clients/hairdresser/config.json') as Promise<{ default: ClientConfig }>,
};

/* ── Utilitário: aplica tema via data-tenant no <html> ───────
   O tokens.css define [data-tenant='slug'] com todos os overrides.
   Nenhuma var é injetada inline — tudo fica no CSS estático.       */
function applyTheme(config: ClientConfig): () => void {
  const root = document.documentElement;
  const { slug } = config;

  // Aplica o tenant — ativa os tokens da Camada 3 no tokens.css
  root.setAttribute('data-tenant', slug);

  // Meta theme-color do browser
  let metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = config.meta.themeColor ?? config.theme.colorBg;

  // Title e description
  document.title = config.meta.title;
  const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDesc) metaDesc.content = config.meta.description;

  // Cleanup: remove o atributo ao navegar para rota não-tenant (ex: /dashboard)
  return () => {
    root.removeAttribute('data-tenant');
    document.title = 'App';
  };
}


/* ── Componente ──────────────────────────────────────────── */
interface ClientPageProps {
  page: PageType;
}

export function ClientPage({ page }: ClientPageProps): React.ReactElement {
  const { clientSlug = '' } = useParams<{ clientSlug: string }>();
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loader = CLIENT_REGISTRY[clientSlug];
    if (!loader) {
      setError(true);
      return;
    }

    let cancelled = false;
    loader()
      .then((mod) => {
        if (cancelled) return;
        setConfig(mod.default);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => { cancelled = true; };
  }, [clientSlug]);

  // Aplica tema assim que o config carrega
  useEffect(() => {
    if (!config) return;
    return applyTheme(config);
  }, [config]);

  /* Slug não encontrado no registry → 404 */
  if (error) return <Navigate to="/not-found" replace />;

  /* Carregando */
  if (!config) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0d0803', color: '#888',
        fontFamily: 'Inter, sans-serif',
      }}>
        Carregando…
      </div>
    );
  }

  /* Renderiza o template correto */
  if (page === 'landing') {
    return <LandingPageTemplate config={config} />;
  }

  // Placeholders para templates futuros
  if (page === 'blog') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Blog em breve — {config.brand.name}</div>;
  }

  if (page === 'linktree') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Linktree em breve — {config.brand.name}</div>;
  }

  return <Navigate to="/not-found" replace />;
}
