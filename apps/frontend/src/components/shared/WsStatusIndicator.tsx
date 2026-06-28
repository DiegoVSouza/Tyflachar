import React from 'react';
import type { WsStatus } from 'types';
import styles from './WsStatusIndicator.module.css';

interface Props {
  status: WsStatus;
}

const LABELS: Record<WsStatus, string> = {
  connecting: 'Connecting...',
  connected: 'Online',
  disconnected: 'Offline',
  error: 'Connection error',
};

export function WsStatusIndicator({ status }: Props): React.ReactElement {
  return (
    <span
      className={`${styles.indicator} ${styles[status]}`}
      title={LABELS[status]}
      aria-label={`WebSocket: ${LABELS[status]}`}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{LABELS[status]}</span>
    </span>
  );
}