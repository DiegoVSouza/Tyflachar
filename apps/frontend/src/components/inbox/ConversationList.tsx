import React from 'react';
import type { Conversation, ConversationId } from 'types';
import { ConversationItem } from './ConversationItem';
import styles from './ConversationList.module.css';

interface Props {
  conversations: Conversation[];
  selectedConversationId: ConversationId | null;
  isLoading: boolean;
  onSelect: (id: ConversationId) => void;
}


export function ConversationList({
  conversations,
  selectedConversationId,
  isLoading,
  onSelect,
}: Props): React.ReactElement {
  const filtered =
    conversations;

  return (
    <div className={styles.panel}>
      <div className={styles.list} role="list" aria-label="Conversas">
        {isLoading && (
          <p className={styles.state}>Carregando conversas...</p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className={styles.state}>Nenhuma conversa encontrada.</p>
        )}
        {filtered.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isSelected={conv.id === selectedConversationId}
            onClick={() => onSelect(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}
