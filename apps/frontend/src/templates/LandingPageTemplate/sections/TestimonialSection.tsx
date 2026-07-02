import React, { memo, useState } from 'react';
import styles from '../LandingPage.module.css';
import { TestimonialConfig } from 'types/client.types';
import { Icon } from 'components/ui/Icon';

interface TestimonialSectionProps {
  config: TestimonialConfig;
}

function TestimonialSectionBase({ config }: TestimonialSectionProps): React.ReactElement | null {
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
          <span className={styles.quoteGlyph}>&quot;</span>
          <blockquote className={styles.testimonialQuote}>
            &quot;{current.quote}&quot;
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
              <Icon name="chevron-left" size={20} />
            </button>
            <button className={styles.controlBtn} aria-label="Próximo" onClick={next}>
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export const TestimonialSection = memo(TestimonialSectionBase);
