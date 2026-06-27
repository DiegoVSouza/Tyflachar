import React, { useState } from 'react';
import styles from '../LandingPage.module.css';
import { TestimonialConfig } from 'types/client.types';

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface TestimonialSectionProps {
  config: TestimonialConfig;
}

export function TestimonialSection({ config }: TestimonialSectionProps): React.ReactElement | null {
  const [index, setIndex] = useState(0);
  const current = config.items[index];

  if (!current) return null;


  const prev = () => setIndex((i) => (i - 1 + config.items.length) % config.items.length);
  const next = () => setIndex((i) => (i + 1) % config.items.length);

  return (
    <section className={`${styles.testimonial} ${styles.fadeIn}`}>
      <div className={styles.testimonialInner}>
        <span className={styles.eyebrowLight}>{config.eyebrow}</span>
        <div className={styles.testimonialBody}>
          <span className={styles.quoteGlyph}>"</span>
          <blockquote className={styles.testimonialQuote}>
            "{current.quote}"
          </blockquote>
          <div className={styles.testimonialCite}>
            <span className={styles.citeRule} />
            <cite className={styles.citeText}>{current.author}</cite>
            <span className={styles.citeRule} />
          </div>
        </div>
        {config.items.length > 1 && (
          <div className={styles.testimonialControls}>
            <button className={styles.controlBtn} aria-label="Anterior" onClick={prev}>
              <IconChevronLeft />
            </button>
            <button className={styles.controlBtn} aria-label="Próximo" onClick={next}>
              <IconChevronRight />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
