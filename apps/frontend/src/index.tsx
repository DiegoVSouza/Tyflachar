import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

/* ── Aplicação síncrona de tenant ANTES do primeiro render ───
 *
 * Por que aqui e não no useEffect do ClientPage?
 * useEffect roda APÓS o React montar — já existe uma janela onde
 * os tokens padrão (azuis do dashboard) são usados para pintar a
 * tela, causando um flash visível.
 *
 * Ao setar data-tenant aqui, o atributo já existe no <html>
 * antes de qualquer frame ser desenhado, então o CSS da Camada 3
 * (tokens do tenant) é aplicado no paint inicial.
 *
 * Para adicionar um novo tenant, inclua o slug no array abaixo.
 * Mantenha em sincronia com CLIENT_REGISTRY em ClientPage.tsx.
 * ─────────────────────────────────────────────────────────── */
const KNOWN_TENANT_SLUGS = ['hairdresser'];

(function applyTenantEarly() {
  const slug = window.location.pathname.split('/')[1] ?? '';
  if (slug && KNOWN_TENANT_SLUGS.includes(slug)) {
    document.documentElement.setAttribute('data-tenant', slug);
  }
})();

/* ── Mount ────────────────────────────────────────────────── */
const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element #root not found. Check public/index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
