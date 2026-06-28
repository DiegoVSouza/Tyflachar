import React, { useState } from 'react';
import { useAppointments } from 'hooks/useAppointments';
import { AppointmentsTable } from 'components/appointments/AppointmentsTable';
import { NewAppointmentModal } from 'components/appointments/NewAppointmentModal';
import type { AppointmentId, AppointmentStatus, UpdateAppointmentInput, CreateAppointmentInput, Appointment } from 'types';
import styles from './AppointmentsPage.module.css';

type PeriodFilter = '' | "today" | "week" | "month";
type StatusFilter = '' | AppointmentStatus;

export function AppointmentsPage(): React.ReactElement {
  const [period, setPeriod] = useState<PeriodFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [modalOpen, setModalOpen] = useState(false);

  const { appointments, isLoading, create, update } = useAppointments({
    ...(period ? { period } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  async function handleCreate(data: CreateAppointmentInput) {
    await create(data);
  }

  function handleUpdate(id: AppointmentId, data: UpdateAppointmentInput) {
    update(id, data);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Agendamentos</h1>
          <p className={styles.subtitle}>Gerencie sua agenda de negócios</p>
        </div>
        <button
          id="btn-new-appointment"
          className={styles.btnNew}
          onClick={() => setModalOpen(true)}
        >
          + Novo agendamento
        </button>
      </header>

      <div className={styles.filters} role="group" aria-label="Appointment filters">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Periodo:</span>
          {(['', 'today', 'week', 'month'] as PeriodFilter[]).map((p) => (
            <button
              key={p || 'all'}
              id={`filter-period-${p || 'all'}`}
              className={`${styles.filterBtn} ${period === p ? styles.filterActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '' ? 'Todos' : p === 'today' ? 'Hoje' : p === 'week' ? 'Esta semana' : 'Este mes'}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status:</span>
          {(['', 'pending', 'confirmed', 'cancelled'] as StatusFilter[]).map((s) => (
            <button
              key={s || 'all'}
              id={`filter-status-${s || 'all'}`}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'Todos' : s === 'pending' ? 'Pendente' : s === 'confirmed' ? 'Confirmado' : 'Cancelado'}
            </button>
          ))}
        </div>
      </div>

      <AppointmentsTable
        appointments={(appointments ?? []) as Appointment[]}
        isLoading={(isLoading ?? false) as boolean}
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