import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage(): React.ReactElement {
  return (
    <div className={styles.page}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>Página não encontrada.</p>
      <Link to="/" className={styles.link}>
        Voltar ao início
      </Link>
    </div>
  );
}
