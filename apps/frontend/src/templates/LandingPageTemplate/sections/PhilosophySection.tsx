import React, { memo } from 'react';
import styles from '../LandingPage.module.css';
import { PhilosophyConfig } from 'types/client.types';

interface PhilosophySectionProps {
  config: PhilosophyConfig;
}

function PhilosophySectionBase({ config }: PhilosophySectionProps): React.ReactElement {
  return (
    <section className={`${styles.filosofia} ${styles.fadeIn}`} id="salon">
      <div className={styles.filosofiaImg}>
        <img src={config.imageSrc} alt={config.imageAlt} loading="lazy" decoding="async" />
        <blockquote className={styles.filosofiaQuote}>
          &quot;{config.quote}&quot;
        </blockquote>
      </div>
      <div className={styles.filosofiaBody}>
        <span className={styles.eyebrow}>{config.eyebrow}</span>
        <h2 className={styles.sectionTitle}>
          {config.titleLine1}{' '}
          <br /><em className={styles.heroEm}>{config.titleEm}</em>
        </h2>
        {config.paragraphs.map((p, i) => (
          <p key={i} className={styles.bodyText}>{p}</p>
        ))}
        <a href="#historia" className={styles.linkUnderline}>
          {config.historyLinkLabel}
          <span className={styles.linkLine} />
        </a>
      </div>
    </section>
  );
}

export const PhilosophySection = memo(PhilosophySectionBase);
