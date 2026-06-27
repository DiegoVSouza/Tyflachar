import React from 'react';
import styles from '../LandingPage.module.css';
import { NewsletterConfig } from 'types/client.types';

interface NewsletterSectionProps {
  config: NewsletterConfig;
}

export function NewsletterSection({ config }: NewsletterSectionProps): React.ReactElement {
  return (
    <section className={`${styles.newsletter} ${styles.fadeIn}`}>
      <div className={styles.newsletterBox}>
        {config.logoBadgeSrc && (
          <div className={styles.newsletterDivider}>
            <img
              src={config.logoBadgeSrc}
              alt=""
              className={styles.newsletterLogo}
            />
          </div>
        )}
        <h2 className={styles.newsletterTitle}>{config.title}</h2>
        <p className={styles.newsletterSub}>{config.subtitle}</p>
        <div className={styles.newsletterForm}>
          <input
            type="email"
            placeholder={config.placeholder}
            className={styles.newsletterInput}
          />
          <button className={styles.newsletterBtn}>{config.buttonLabel}</button>
        </div>
      </div>
    </section>
  );
}
