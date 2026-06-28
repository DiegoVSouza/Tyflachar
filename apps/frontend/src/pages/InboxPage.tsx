import React, { useState } from 'react';
import { useConversations } from 'hooks/useConversations';
import { ConversationList } from 'components/inbox/ConversationList';
import { MessagesPanel } from 'components/inbox/MessagesPanel';
import type { ConversationId, ConversationStatus } from 'types';
import styles from './InboxPage.module.css';

type QuickFilter = 'all' | ConversationStatus;

const FILTERS: { label: string; value: QuickFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Aberto', value: 'open' },
  { label: 'Aguardando', value: 'waiting_agent' },
  { label: 'Fechado', value: 'closed' },
];

export function InboxPage(): React.ReactElement {
  const [filter, setFilter] = useState<QuickFilter>('all');

  const { conversations, selectedConversation, messages, isLoading, isMessagesLoading, openConversation, send } =
    useConversations(filter !== 'all' ? { status: filter as ConversationStatus } : {});

  function handleSelect(id: ConversationId) {
    openConversation(id);
  }

  function handleSend(id: ConversationId, text: string) {
    send(id, { content: text });
  }

  return (
    <div className={styles.inbox}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Conversas</h2>
          <span className={styles.count}>{conversations.length}</span>
        </header>

        <div className={styles.filters} role="group" aria-label="Filtro de conversas">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              id={`filter-${f.value}`}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id ?? null}
          isLoading={isLoading}
          onSelect={handleSelect}
        />
      </aside>

      <main className={styles.main}>
        {selectedConversation ? (
          <MessagesPanel
            conversation={selectedConversation}
            messages={messages}
            isLoading={isMessagesLoading}
            onSend={handleSend}
          />
        ) : (
          <div className={styles.empty} role="status">
            <span className={styles.emptyIcon} aria-hidden="true">💬</span>
            <p className={styles.emptyTitle}>Selecionar conversa</p>
            <p className={styles.emptySubtitle}>Escolha uma conversa para ver as mensagens.</p>
          </div>
        )}
      </main>
    </div>
  );
}
