import React, { useState, useEffect } from 'react';
import type { Cliente, CriarAgendamentoInput, ClienteId } from 'types';
import { ClientSearch } from './ClientSearch';
import styles from './NewAppointmentModal.module.css';

const SERVICES = [
  'Corte',
  'Coloração',
  'Mechas',
  'Alisamento',
  'Hidratação',
  'Tratamento capilar',
  'Escova',
  'Penteado',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CriarAgendamentoInput) => Promise<void>;
}

interface FormState {
  client: Cliente | null;
  service: string;
  date: string;
  time: string;
}

const INITIAL: FormState = {
  client: null,
  service: '',
  date: '',
  time: '',
};

export function NewAppointmentModal({ isOpen, onClose, onSave }: Props): React.ReactElement | null {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isValid = form.client && form.service && form.date && form.time;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !form.client) return;

    setSaving(true);
    setError(null);
    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      await onSave({
        clienteId: form.client.id as ClienteId,
        servico: form.service,
        dataHora: dateTime,
      });
      onClose();
    } catch {
      setError('Failed to save appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>New Appointment</h2>
          <button
            id="btn-close-modal"
            className={styles.btnClose}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        <form id="form-new-appointment" onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-search">
              Client <span aria-hidden="true">*</span>
            </label>
            <ClientSearch
              value={form.client}
              onSelect={(c) => setForm((f) => ({ ...f, client: c }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="select-service">
              Service <span aria-hidden="true">*</span>
            </label>
            <select
              id="select-service"
              className={styles.select}
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              required
            >
              <option value="">Select a service…</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="input-date">
                Date <span aria-hidden="true">*</span>
              </label>
              <input
                id="input-date"
                type="date"
                className={styles.input}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="input-time">
                Time <span aria-hidden="true">*</span>
              </label>
              <input
                id="input-time"
                type="time"
                className={styles.input}
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">{error}</p>
          )}
        </form>

        <footer className={styles.footer}>
          <button
            id="btn-cancel-appointment"
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="btn-save-appointment"
            type="submit"
            form="form-new-appointment"
            className={styles.btnSave}
            disabled={!isValid || saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </footer>
      </div>
    </div>
  );
}
