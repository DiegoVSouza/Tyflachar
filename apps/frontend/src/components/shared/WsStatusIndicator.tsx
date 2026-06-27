/**
 * WsStatusIndicator.tsx
 *
 * Bolinha de status da conexão WebSocket (verde/amarelo/vermelho).
 */

import React from 'react';
import type { WsStatus } from 'types';
import styles from './WsStatusIndicator.module.css';

interface Props {
  status: WsStatus;
}

const LABELS: Record<WsStatus, string> = {
  conectando: 'Conectando...',
  conectado: 'Online',
  desconectado: 'Offline',
  erro: 'Erro de conexão',
};

export function WsStatusIndicator({ status }: Props): React.ReactElement {
  return (
    <span
      className={`${styles.indicator} ${styles[status]}`}
      title={LABELS[status]}
      aria-label={`WhatsApp: ${LABELS[status]}`}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{LABELS[status]}</span>
    </span>
  );
}
