import React from 'react';
import type { AppointmentStatus } from 'types';
import styles from './StatusBadge.module.css';

interface Props {
  status: AppointmentStatus;
}

const LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: Props): React.ReactElement {
  return (
    <span className={`${styles.badge} ${styles[status]}`} aria-label={`Status: ${LABEL[status]}`}>
      {LABEL[status]}
    </span>
  );
}