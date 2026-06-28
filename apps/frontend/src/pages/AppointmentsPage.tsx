import React, { useState } from 'react';
import { useAppointments } from 'hooks/useAppointments';
import { AppointmentsTable } from 'components/appointments/AppointmentsTable';
import { NewAppointmentModal } from 'components/appointments/NewAppointmentModal';
import type { AgendamentoId, AgendamentoStatus, AtualizarAgendamentoInput, CriarAgendamentoInput } from 'types';
import styles from './AppointmentsPage.module.css';

type PeriodFilter = '' | 'hoje' | 'semana' | 'mes';
type StatusFilter = '' | AgendamentoStatus;

export function AppointmentsPage(): React.ReactElement {
  const [period, setPeriod] = useState<PeriodFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [modalOpen, setModalOpen] = useState(false);

  const { appointments, isLoading, create, update } = useAppointments({
    ...(period ? { data: period } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  async function handleCreate(data: CriarAgendamentoInput) {
    await create(data);
  }

  function handleUpdate(id: AgendamentoId, data: AtualizarAgendamentoInput) {
    update(id, data);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Manage the salon schedule</p>
        </div>
        <button
          id="btn-new-appointment"
          className={styles.btnNew}
          onClick={() => setModalOpen(true)}
        >
          + New appointment
        </button>
      </header>

      <div className={styles.filters} role="group" aria-label="Appointment filters">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Period:</span>
          {(['', 'hoje', 'semana', 'mes'] as PeriodFilter[]).map((p) => (
            <button
              key={p || 'all'}
              id={`filter-period-${p || 'all'}`}
              className={`${styles.filterBtn} ${period === p ? styles.filterActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '' ? 'All' : p === 'hoje' ? 'Today' : p === 'semana' ? 'This week' : 'This month'}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status:</span>
          {(['', 'pendente', 'confirmado', 'cancelado'] as StatusFilter[]).map((s) => (
            <button
              key={s || 'all'}
              id={`filter-status-${s || 'all'}`}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <AppointmentsTable
        appointments={appointments}
        isLoading={isLoading}
        onUpdateStatus={handleUpdate}
      />

      <NewAppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
      />
    </div>
  );
}
