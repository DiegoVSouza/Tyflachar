import React from 'react';
import styles from '../LandingPage.module.css';
import { NavConfig, ClientBrand } from 'types/client.types';

interface NavSectionProps {
  config: NavConfig;
  brand: ClientBrand;
  navRef: React.RefObject<HTMLElement>;
}

export function NavSection({ config, brand, navRef }: NavSectionProps): React.ReactElement {
  return (
    <nav ref={navRef} className={styles.nav}>
      <div className={styles.navInner}>
        <div className={styles.navBrand}>
          <img src={brand.logoSrc} alt={`${brand.name} logo`} style={{ height: 40, width: 'auto' }} />
          <span className={styles.navName}>{brand.name}</span>
        </div>
        <div className={styles.navLinks}>
          {config.links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${i === 0 ? styles.navLinkActive : ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>
        <a href={config.ctaHref ?? '#agendar'} className={styles.btnPrimary}>
          {config.ctaLabel}
        </a>
      </div>
    </nav>
  );
}
