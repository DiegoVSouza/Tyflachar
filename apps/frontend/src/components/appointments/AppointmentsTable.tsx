import React from 'react';
import type { Agendamento, AgendamentoId, AgendamentoStatus, AtualizarAgendamentoInput } from 'types';
import { StatusBadge } from './StatusBadge';
import styles from './AppointmentsTable.module.css';

interface Props {
  appointments: Agendamento[];
  isLoading: boolean;
  onUpdateStatus: (id: AgendamentoId, data: AtualizarAgendamentoInput) => void;
}

const NEXT_STATUS: Record<AgendamentoStatus, AgendamentoStatus[]> = {
  pendente: ['confirmado', 'cancelado'],
  confirmado: ['cancelado'],
  cancelado: [],
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AppointmentsTable({ appointments, isLoading, onUpdateStatus }: Props): React.ReactElement {
  if (isLoading) {
    return (
      <div className={styles.state} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        Loading appointments…
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className={styles.state} role="status">
        <span className={styles.emptyIcon} aria-hidden="true">📅</span>
        <p>No appointments found.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} role="region" aria-label="Appointments list">
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th scope="col" className={styles.th}>Client</th>
            <th scope="col" className={styles.th}>Service</th>
            <th scope="col" className={styles.th}>Date & Time</th>
            <th scope="col" className={styles.th}>Status</th>
            <th scope="col" className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const next = NEXT_STATUS[appt.status];
            return (
              <tr key={appt.id} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.name}>{appt.clienteNome}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.service}>{appt.servico}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.dateTime}>{formatDateTime(appt.dataHora)}</span>
                </td>
                <td className={styles.td}>
                  <StatusBadge status={appt.status} />
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    {next.map((newStatus) => (
                      <button
                        key={newStatus}
                        id={`btn-status-${appt.id}-${newStatus}`}
                        className={`${styles.btnAction} ${styles[newStatus]}`}
                        onClick={() => onUpdateStatus(appt.id, { status: newStatus })}
                        title={`Mark as ${newStatus}`}
                      >
                        {newStatus === 'confirmado' ? '✅ Confirm' : '✕ Cancel'}
                      </button>
                    ))}
                    {next.length === 0 && (
                      <span className={styles.noActions}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
