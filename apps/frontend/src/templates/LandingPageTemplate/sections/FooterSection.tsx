import React, { memo } from 'react';
import styles from '../LandingPage.module.css';
import { FooterConfig, ClientBrand } from 'types/client.types';

interface FooterSectionProps {
  config: FooterConfig;
  brand: ClientBrand;
}

function FooterSectionBase({ config, brand }: FooterSectionProps): React.ReactElement {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogoRow}>
            <img
              src={brand.logoSrc}
              alt={`${brand.name} logo`}
              className={styles.footerLogo}
              loading="lazy"
              decoding="async"
            />
            <span className={styles.footerName}>{brand.name}</span>
          </div>
          {brand.tagline && (
            <p className={styles.footerTagline}>{brand.tagline}</p>
          )}
        </div>
        {config.columns.map((col) => (
          <div key={col.title} className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>{col.title}</h4>
            {col.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={styles.footerLink}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>{config.copyright}</p>
        <div className={styles.footerIcons}>
          <span>↗</span><span>🌐</span><span>🔒</span>
        </div>
      </div>
    </footer>
  );
}

export const FooterSection = memo(FooterSectionBase);
