import React from 'react';
import type { Conversa } from 'types';
import styles from './ConversationItem.module.css';

interface Props {
  conversation: Conversa;
  isSelected: boolean;
  onClick: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}


export function ConversationItem({ conversation, isSelected, onClick }: Props): React.ReactElement {
  return (
    <button
      id={`conversation-${conversation.id}`}
      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`Conversa com ${conversation.client_name}, ${conversation.unread} não lidas`}
    >
      <div className={styles.avatar} aria-hidden="true">
        {conversation.client_name[0]?.toUpperCase()}
      </div>
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.name}>{conversation.client_name}</span>
          <time className={styles.time} dateTime={conversation.last_message_at}>
            {formatTime(conversation.last_message_at)}
          </time>
        </div>
        <div className={styles.bottomRow}>
          <p className={styles.preview}>{conversation.last_message}</p>
          {conversation.unread > 0 && (
            <span className={styles.badge} aria-label={`${conversation.unread} não lidas`}>
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
