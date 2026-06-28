import React, { useState } from 'react';
import type { Conversa, ConversaId, ConversaStatus } from 'types';
import { ConversationItem } from './ConversationItem';
import styles from './ConversationList.module.css';

type StatusFilter = 'all' | ConversaStatus;

interface Props {
  conversations: Conversa[];
  selectedConversationId: ConversaId | null;
  isLoading: boolean;
  onSelect: (id: ConversaId) => void;
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'aberta', label: 'Open' },
  { key: 'aguardando', label: 'Waiting' },
];

export function ConversationList({
  conversations,
  selectedConversationId,
  isLoading,
  onSelect,
}: Props): React.ReactElement {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered =
    filter === 'all' ? conversations : conversations.filter((c) => c.status === filter);

  return (
    <div className={styles.panel}>
      <div className={styles.filters} role="tablist" aria-label="Filtros de conversa">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            role="tab"
            aria-selected={filter === f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

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
