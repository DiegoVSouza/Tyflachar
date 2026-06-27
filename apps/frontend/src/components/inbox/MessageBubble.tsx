import React from 'react';
import type { Mensagem } from 'types';
import styles from './MessageBubble.module.css';

interface Props {
  message: Mensagem;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageBubble({ message }: Props): React.ReactElement {
  const isClient = message.origem === 'cliente';

  return (
    <div className={`${styles.wrapper} ${isClient ? styles.client : styles.internal}`}>
      <div className={styles.bubble}>
        {message.origem === 'bot' && (
          <span className={styles.originTag} aria-label="Sent by bot">🤖</span>
        )}
        <p className={styles.content}>{message.conteudo}</p>
        <time className={styles.time} dateTime={message.criadaEm}>
          {formatTime(message.criadaEm)}
        </time>
      </div>
    </div>
  );
}
