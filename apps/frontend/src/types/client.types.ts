/* ─────────────────────────────────────────────────────────────
 * client.types.ts
 * Interfaces do pseudo-CMS baseado em JSON.
 * Cada cliente tem um config.json que implementa ClientConfig.
 * ───────────────────────────────────────────────────────────── */

export interface ClientMeta {
  title: string;
  description: string;
  themeColor?: string;
}

export interface ClientBrand {
  name: string;
  /** Caminho relativo a /public, ex: /clients/hairdresser/logo.svg */
  logoSrc: string;
  tagline?: string;
}

export interface ClientTheme {
  colorPrimary: string;
  colorSecondary?: string;
  colorBg: string;
  colorSurface?: string;
  colorAccentWarm?: string;
  fontHeading?: string;
  fontBody?: string;
}

/* ── Seções da Landing Page ───────────────────────────────── */

export interface HeroConfig {
  imageSrc: string;
  headline: string;
  headlineEm: string;
  subtext: string;
  ctaPrimary: string;
  ctaSecondary?: string;
}

export interface PhilosophyConfig {
  eyebrow: string;
  imageSrc: string;
  imageAlt: string;
  quote: string;
  titleLine1: string;
  titleEm: string;
  paragraphs: string[];
  historyLinkLabel: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  desc: string;
  price: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  span: 'large' | 'small' | 'tall';
}

export interface TestimonialItem {
  quote: string;
  author: string;
}

export interface ServicesConfig {
  eyebrow: string;
  title: string;
  items: ServiceItem[];
}

export interface GalleryConfig {
  eyebrow: string;
  title: string;
  instagramLabel: string;
  items: GalleryItem[];
}

export interface TestimonialConfig {
  eyebrow: string;
  items: TestimonialItem[];
}

export interface NewsletterConfig {
  title: string;
  subtitle: string;
  placeholder: string;
  buttonLabel: string;
  logoBadgeSrc?: string;
}

/* ── Nav & Footer ─────────────────────────────────────────── */

export interface NavLink {
  label: string;
  href: string;
}

export interface NavConfig {
  links: NavLink[];
  ctaLabel: string;
  /** URL de agendamento externo, ex: https://calendly.com/... */
  ctaHref?: string;
}

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface FooterConfig {
  columns: FooterColumn[];
  copyright: string;
}

/* ── Páginas habilitadas ──────────────────────────────────── */

export interface LandingPageConfig {
  hero: HeroConfig;
  philosophy: PhilosophyConfig;
  services: ServicesConfig;
  gallery: GalleryConfig;
  testimonials: TestimonialConfig;
  newsletter: NewsletterConfig;
}

export interface LinktreeLink {
  label: string;
  url: string;
  icon?: string;
}

export interface LinktreeConfig {
  links: LinktreeLink[];
}

export interface PagesConfig {
  landing: LandingPageConfig;
  blog?: { enabled: boolean };
  linktree?: LinktreeConfig;
}

/* ── Config raiz do cliente ──────────────────────────────── */

export interface ClientConfig {
  slug: string;
  meta: ClientMeta;
  brand: ClientBrand;
  theme: ClientTheme;
  nav: NavConfig;
  footer: FooterConfig;
  pages: PagesConfig;
}
