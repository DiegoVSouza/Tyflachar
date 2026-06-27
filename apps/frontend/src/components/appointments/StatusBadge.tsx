import React from 'react';
import type { AgendamentoStatus } from 'types';
import styles from './StatusBadge.module.css';

interface Props {
  status: AgendamentoStatus;
}

const LABEL: Record<AgendamentoStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};

export function StatusBadge({ status }: Props): React.ReactElement {
  return (
    <span className={`${styles.badge} ${styles[status]}`} aria-label={`Status: ${LABEL[status]}`}>
      {LABEL[status]}
    </span>
  );
}
