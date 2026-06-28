import React from 'react';
import type { Message } from 'types';
import styles from './MessageBubble.module.css';

interface Props {
  message: Message;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageBubble({ message }: Props): React.ReactElement {
  const isClient = message.direction === 'in';
  const isBot = message.type === 'interactive' || message.type === 'button';

  return (
    <div className={`${styles.wrapper} ${isClient ? styles.client : styles.internal}`}>
      <div className={styles.bubble}>
        {!isClient && isBot && (
          <span className={styles.originTag} aria-label="Sent by bot">🤖</span>
        )}
        <p className={styles.content}>{message.content}</p>
        <time className={styles.time} dateTime={message.timestamp}>
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
}