import React from 'react';
import styles from '../LandingPage.module.css';
import { ServicesConfig } from 'types/client.types';

/* ── Ícones SVG inline ──────────────────────────────────── */
const IconCut = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);
const IconDrop = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);
const IconFlare = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36-.7.7M6.34 17.66l-.7.7m12.02.7-.7-.7M6.34 6.34l-.7-.7" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
const IconEco = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5C9 16 9 13 12 10c3-3 6-3 9-3-1 4-2 7-5 9s-6 3-9 3c-1.75 0-3.25-.5-5-1z" />
    <path d="M2 22 12 12" />
  </svg>
);
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const ICON_MAP: Record<string, React.FC> = {
  cut: IconCut,
  drop: IconDrop,
  flare: IconFlare,
  eco: IconEco,
};

interface ServicesSectionProps {
  config: ServicesConfig;
}

export function ServicesSection({ config }: ServicesSectionProps): React.ReactElement {
  return (
    <section className={`${styles.services} ${styles.fadeIn}`} id="art">
      <div className={styles.servicesInner}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>{config.eyebrow}</span>
          <h2 className={styles.sectionTitle}>{config.title}</h2>
        </div>
        <div className={styles.servicesGrid}>
          {config.items.map(({ icon, title, desc, price }) => {
            const Icon = ICON_MAP[icon] ?? IconCut;
            return (
              <article key={title} className={styles.serviceCard}>
                <div className={styles.serviceIcon}><Icon /></div>
                <h3 className={styles.serviceTitle}>{title}</h3>
                <p className={styles.serviceDesc}>{desc}</p>
                <div className={styles.serviceFoot}>
                  <span className={styles.servicePrice}>{price}</span>
                  <span className={styles.serviceArrow}><IconArrow /></span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
