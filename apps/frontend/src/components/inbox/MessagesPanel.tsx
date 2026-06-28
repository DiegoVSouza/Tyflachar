import React, { useEffect, useRef } from 'react';
import type { Conversation, ConversationId, Message } from 'types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import styles from './MessagesPanel.module.css';

interface Props {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  onSend: (id: ConversationId, text: string) => void;
}

export function MessagesPanel({ conversation, messages, isLoading, onSend }: Props): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.avatar} aria-hidden="true">
          {conversation.client_name[0]?.toUpperCase()}
        </div>
        <div>
          <p className={styles.name}>{conversation.client_name}</p>
          <p className={styles.phone}>{conversation.client_phone}</p>
        </div>
        <span
          className={`${styles.statusBadge} ${styles[conversation.status]}`}
          aria-label={`Status: ${conversation.status}`}
        >
          {conversation.status}
        </span>
      </header>

      <div className={styles.messages} aria-label="Message history" role="log">
        {isLoading && <p className={styles.state}>Loading messages...</p>}
        {!isLoading && messages.length === 0 && (
          <p className={styles.state}>No messages yet.</p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={(text) => onSend(conversation.id, text)}
        disabled={conversation.status === 'closed'}
      />
    </div>
  );
}