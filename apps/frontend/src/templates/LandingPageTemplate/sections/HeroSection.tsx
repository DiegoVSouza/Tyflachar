import React, { memo } from 'react';
import styles from '../LandingPage.module.css';
import { HeroConfig } from 'types/client.types';

interface HeroSectionProps {
  config: HeroConfig;
  ctaHref?: string;
}

function HeroSectionBase({ config, ctaHref }: HeroSectionProps): React.ReactElement {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg}>
        <img
          src={config.imageSrc}
          alt="Hero"
          className={styles.heroImg}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className={styles.heroOverlay} />
      </div>
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.heroHeadline}>
            {config.headline}{' '}
            <em className={styles.heroEm}>{config.headlineEm}</em>
          </h1>
          <p className={styles.heroSub}>{config.subtext}</p>
          <div className={styles.heroCtas}>
            <a href={ctaHref ?? '#agendar'} className={styles.btnPrimary}>
              {config.ctaPrimary}
            </a>
            {config.ctaSecondary && (
              <a href="#services" className={styles.btnOutline}>
                {config.ctaSecondary}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const HeroSection = memo(HeroSectionBase);
