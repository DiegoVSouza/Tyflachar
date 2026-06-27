import React from 'react';
import styles from '../LandingPage.module.css';
import { GalleryConfig } from 'types/client.types';

interface GallerySectionProps {
  config: GalleryConfig;
}

export function GallerySection({ config }: GallerySectionProps): React.ReactElement {
  return (
    <section className={`${styles.gallery} ${styles.fadeIn}`} id="team">
      <div className={styles.galleryHeader}>
        <div>
          <span className={styles.eyebrow}>{config.eyebrow}</span>
          <h2 className={styles.sectionTitle}>{config.title}</h2>
        </div>
        <button className={styles.linkBtn}>{config.instagramLabel}</button>
      </div>
      <div className={styles.galleryGrid}>
        {config.items.map(({ src, alt, span }) => (
          <div
            key={alt}
            className={`${styles.galleryItem} ${styles[`galleryItem__${span}`]}`}
          >
            <img src={src} alt={alt} className={styles.galleryImg} />
          </div>
        ))}
      </div>
    </section>
  );
}
