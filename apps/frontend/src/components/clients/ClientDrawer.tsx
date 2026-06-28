import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import { selecionarConversa } from 'store/slices/conversationSlice';
import type { Cliente, Agendamento, ClienteId } from 'types';
import { StatusBadge } from 'components/appointments/StatusBadge';
import { InputTags } from './InputTags';
import styles from './ClientDrawer.module.css';

interface Props {
  client: Cliente;
  appointments: Agendamento[];
  loadingAppointments: boolean;
  onClose: () => void;
  onUpdateTags: (id: ClienteId, tags: string[]) => void;
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
    if (client.conversaId) {
      dispatch(selecionarConversa(client.conversaId));
      navigate('/dashboard/inbox');
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />

      <aside className={styles.drawer} aria-label={`Detalhes do cliente ${client.nome}`}>
        <header className={styles.header}>
          <div className={styles.avatar} aria-hidden="true">
            {client.nome[0]?.toUpperCase()}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{client.nome}</h2>
            <p className={styles.phone}>{client.telefone}</p>
          </div>
          <button
            id="btn-close-drawer"
            className={styles.btnClose}
            onClick={onClose}
            aria-label="Fechar painel"
          >
            ✕
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Detalhes</h3>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Registrado</span>
              <span className={styles.fieldValue}>{formatDate(client.criadoEm)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Phone</span>
              <span className={styles.fieldValue}>{client.telefone}</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Tags
              {savingTags && <span className={styles.saving}> (salvando…)</span>}
            </h3>
            <InputTags
              tags={tags}
              onChange={handleTagsChange}
              placeholder="e.g. VIP, color, cut…"
            />
          </section>

          {client.conversaId && (
            <section className={styles.section}>
              <button
                id="btn-open-conversation"
                className={styles.btnConversation}
                onClick={goToConversation}
              >
                💬 Abrir conversa
              </button>
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Agendamentos</h3>
            {loadingAppointments && (
              <p className={styles.state}>Carregando…</p>
            )}
            {!loadingAppointments && appointments.length === 0 && (
              <p className={styles.state}>Nenhum agendamento.</p>
            )}
            {!loadingAppointments && appointments.length > 0 && (
              <ul className={styles.apptList}>
                {appointments.map((appt) => (
                  <li key={appt.id} className={styles.apptItem}>
                    <div className={styles.apptInfo}>
                      <span className={styles.apptService}>{appt.servico}</span>
                      <span className={styles.apptDate}>{formatDateTime(appt.dataHora)}</span>
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
