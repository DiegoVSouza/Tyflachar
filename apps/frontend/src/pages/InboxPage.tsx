import React, { useState } from 'react';
import { useConversations } from 'hooks/useConversations';
import { ConversationList } from 'components/inbox/ConversationList';
import { MessagesPanel } from 'components/inbox/MessagesPanel';
import type { ConversaId, ConversaStatus } from 'types';
import styles from './InboxPage.module.css';

type QuickFilter = 'all' | ConversaStatus;

const FILTERS: { label: string; value: QuickFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'aberta' },
  { label: 'Waiting', value: 'aguardando' },
  { label: 'Closed', value: 'fechada' },
];

export function InboxPage(): React.ReactElement {
  const [filter, setFilter] = useState<QuickFilter>('all');

  const { conversations, selectedConversation, messages, isLoading, isMessagesLoading, openConversation, send } =
    useConversations(filter !== 'all' ? { status: filter as ConversaStatus } : {});

  function handleSelect(id: ConversaId) {
    openConversation(id);
  }

  function handleSend(id: ConversaId, text: string) {
    send(id, { conteudo: text });
  }

  return (
    <div className={styles.inbox}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Conversations</h2>
          <span className={styles.count}>{conversations.length}</span>
        </header>

        <div className={styles.filters} role="group" aria-label="Filter conversations">
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
            <p className={styles.emptyTitle}>Select a conversation</p>
            <p className={styles.emptySubtitle}>Choose a conversation on the left to view messages.</p>
          </div>
        )}
      </main>
    </div>
  );
}
