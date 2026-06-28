import React, { useState } from 'react';
import { useClients } from 'hooks/useClients';
import { useDebounce } from 'hooks/useDebounce';
import { ClientsTable } from 'components/clients/ClientsTable';
import { ClientDrawer } from 'components/clients/ClientDrawer';
import type { ClienteId } from 'types';
import styles from './ClientsPage.module.css';

export function ClientsPage(): React.ReactElement {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const {
    clients,
    total,
    selectedClient,
    clientAppointments,
    isLoading,
    status: detailsStatus,
    openClient,
    closeClient,
    updateTags,
    reload,
  } = useClients(debouncedQuery ? { q: debouncedQuery } : {});

  function handleSelect(id: ClienteId) {
    openClient(id);
  }

  async function handleUpdateTags(id: ClienteId, tags: string[]) {
    await updateTags(id, { tags });
    reload();
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Clientes capturados via WhatsApp</p>
        </div>
      </header>

      <ClientsTable
        clients={clients}
        total={total}
        isLoading={isLoading}
        selectedClientId={selectedClient?.id ?? null}
        query={query}
        onSearch={setQuery}
        onSelect={handleSelect}
      />

      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          appointments={clientAppointments}
          loadingAppointments={detailsStatus === 'loading'}
          onClose={closeClient}
          onUpdateTags={handleUpdateTags}
        />
      )}
    </div>
  );
}
