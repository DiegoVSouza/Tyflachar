import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from 'hooks/useNotifications';
import type { ConversaId } from 'types';
import styles from './ToastContainer.module.css';

export function ToastContainer(): React.ReactElement {
  const { toasts, dismissToast } = useNotifications();
  const navigate = useNavigate();

  function goToConversation(conversationId: ConversaId, toastId: number) {
    dismissToast(toastId);
    navigate(`/dashboard/inbox?conversation=${conversationId}`);
  }

  return (
    <div className={styles.container} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
          <div className={styles.icon} aria-hidden="true">💬</div>
          <div className={styles.body}>
            <p className={styles.clientName}>{toast.clientName}</p>
            <p className={styles.message}>{toast.message}</p>
          </div>
          <div className={styles.actions}>
            <button
              id={`toast-view-${toast.id}`}
              className={styles.btnView}
              onClick={() => goToConversation(toast.conversationId, toast.id)}
            >
              View
            </button>
            <button
              id={`toast-close-${toast.id}`}
              className={styles.btnClose}
              onClick={() => dismissToast(toast.id)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
