import React, { memo } from 'react';
import styles from '../LandingPage.module.css';
import { ServicesConfig } from 'types/client.types';
import { Icon } from 'components/ui/Icon';

interface ServicesSectionProps {
  config: ServicesConfig;
}

function ServicesSectionBase({ config }: ServicesSectionProps): React.ReactElement {
  return (
    <section className={`${styles.services} ${styles.fadeIn}`} id="art">
      <div className={styles.servicesInner}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>{config.eyebrow}</span>
          <h2 className={styles.sectionTitle}>{config.title}</h2>
        </div>
        <div className={styles.servicesGrid}>
          {config.items.map(({ icon, title, desc, price }) => (
            <article key={title} className={styles.serviceCard}>
              <div className={styles.serviceIcon}><Icon name={icon} size={32} /></div>
              <h3 className={styles.serviceTitle}>{title}</h3>
              <p className={styles.serviceDesc}>{desc}</p>
              <div className={styles.serviceFoot}>
                <span className={styles.servicePrice}>{price}</span>
                <span className={styles.serviceArrow}><Icon name="arrow-right" size={18} /></span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export const ServicesSection = memo(ServicesSectionBase);
