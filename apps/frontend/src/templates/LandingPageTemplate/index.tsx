/* ─────────────────────────────────────────────────────────────
 * LandingPageTemplate/index.tsx
 * Template genérico de landing page.
 * Recebe um ClientConfig e renderiza todas as seções.
 * Adicionar um novo cliente = criar só o config.json dele.
 * ───────────────────────────────────────────────────────────── */
import React, { useEffect, useRef } from 'react';
import styles from './LandingPage.module.css';
import { ClientConfig } from 'types/client.types';
import { NavSection } from './sections/NavSection';
import { HeroSection } from './sections/HeroSection';
import { PhilosophySection } from './sections/PhilosophySection';
import { ServicesSection } from './sections/ServicesSection';
import { GallerySection } from './sections/GallerySection';
import { TestimonialSection } from './sections/TestimonialSection';
import { NewsletterSection } from './sections/NewsletterSection';
import { FooterSection } from './sections/FooterSection';

interface LandingPageTemplateProps {
  config: ClientConfig;
}

export function LandingPageTemplate({ config }: LandingPageTemplateProps): React.ReactElement {
  const { nav, brand, pages, footer } = config;
  const landing = pages.landing;

  /* Nav shrink on scroll */
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!navRef.current) return;
      navRef.current.classList.toggle(styles.navScrolled, window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Fade-in via Intersection Observer */
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(`.${styles.fadeIn}`);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add(styles.visible)),
      { threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      <NavSection config={nav} brand={brand} navRef={navRef} />
      <HeroSection config={landing.hero} ctaHref={nav.ctaHref} />
      <PhilosophySection config={landing.philosophy} />
      <ServicesSection config={landing.services} />
      <GallerySection config={landing.gallery} />
      <TestimonialSection config={landing.testimonials} />
      <NewsletterSection config={landing.newsletter} />
      <FooterSection config={footer} brand={brand} />
    </main>
  );
}
