import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import { selectConversation } from 'store/slices/conversationSlice';
import type { Client, Appointment, ClientId } from 'types';
import { StatusBadge } from 'components/appointments/StatusBadge';
import { InputTags } from './InputTags';
import styles from './ClientDrawer.module.css';

interface Props {
  client: Client;
  appointments: Appointment[];
  loadingAppointments: boolean;
  onClose: () => void;
  onUpdateTags: (id: ClientId, tags: string[]) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ClientDrawer({
  client,
  appointments,
  loadingAppointments,
  onClose,
  onUpdateTags,
}: Props): React.ReactElement {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [tags, setTags] = useState<string[]>(client.tags);
  const [savingTags, setSavingTags] = useState(false);

  async function handleTagsChange(newTags: string[]) {
    setTags(newTags);
    setSavingTags(true);
    try {
      await onUpdateTags(client.id, newTags);
    } finally {
      setSavingTags(false);
    }
  }

  function goToConversation() {
    if (client.conversation_id) {
      dispatch(selectConversation(client.conversation_id));
      navigate('/dashboard/inbox');
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />

      <aside className={styles.drawer} aria-label={`Client details: ${client.name}`}>
        <header className={styles.header}>
          <div className={styles.avatar} aria-hidden="true">
            {client.name[0]?.toUpperCase()}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{client.name}</h2>
            <p className={styles.phone}>{client.phone}</p>
          </div>
          <button
            id="btn-close-drawer"
            className={styles.btnClose}
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Details</h3>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Registered</span>
              <span className={styles.fieldValue}>{formatDate(client.created_at)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Phone</span>
              <span className={styles.fieldValue}>{client.phone}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Tags
              {savingTags && <span className={styles.saving}> (saving…)</span>}
            </h3>
            <InputTags
              tags={tags ?? []}
              onChange={handleTagsChange}
              placeholder="e.g. VIP, color, cut…"
            />
          </section>

          {client.conversation_id && (
            <section className={styles.section}>
              <button
                id="btn-open-conversation"
                className={styles.btnConversation}
                onClick={goToConversation}
              >
                💬 Open conversation
              </button>
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appointments</h3>
            {loadingAppointments && (
              <p className={styles.state}>Loading…</p>
            )}
            {!loadingAppointments && appointments.length === 0 && (
              <p className={styles.state}>No appointments.</p>
            )}
            {!loadingAppointments && appointments.length > 0 && (
              <ul className={styles.apptList}>
                {appointments.map((appt) => (
                  <li key={appt.id} className={styles.apptItem}>
                    <div className={styles.apptInfo}>
                      <span className={styles.apptService}>{appt.service}</span>
                      <span className={styles.apptDate}>{formatDateTime(appt.scheduled_at)}</span>
                    </div>
                    <StatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}