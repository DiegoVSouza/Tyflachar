import React from 'react';
import type { Cliente, ClienteId } from 'types';
import styles from './ClientsTable.module.css';

interface Props {
  clients: Cliente[];
  total: number;
  isLoading: boolean;
  selectedClientId: ClienteId | null;
  query: string;
  onSearch: (q: string) => void;
  onSelect: (id: ClienteId) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ClientsTable({
  clients,
  total,
  isLoading,
  selectedClientId,
  query,
  onSearch,
  onSelect,
}: Props): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            id="input-search-clients"
            type="search"
            className={styles.searchInput}
            placeholder="Search by name or phone…"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search clients"
          />
        </div>
        <span className={styles.total}>
          {isLoading ? '…' : `${total} client${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {isLoading ? (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          Loading clients…
        </div>
      ) : clients.length === 0 ? (
        <div className={styles.state} role="status">
          <span className={styles.emptyIcon} aria-hidden="true">👤</span>
          <p>{query ? 'No clients found for this search.' : 'No clients registered yet.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper} role="region" aria-label="Clients list">
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th scope="col" className={styles.th}>Client</th>
                <th scope="col" className={styles.th}>Phone</th>
                <th scope="col" className={styles.th}>Registered</th>
                <th scope="col" className={styles.th}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className={`${styles.tr} ${selectedClientId === c.id ? styles.selected : ''}`}
                  onClick={() => onSelect(c.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelect(c.id)}
                  aria-selected={selectedClientId === c.id}
                  role="row"
                >
                  <td className={styles.td}>
                    <div className={styles.clientInfo}>
                      <div className={styles.avatar} aria-hidden="true">
                        {c.nome[0]?.toUpperCase()}
                      </div>
                      <span className={styles.name}>{c.nome}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.phone}>{c.telefone}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.date}>{formatDate(c.criadoEm)}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.tags}>
                      {c.tags.length === 0 && (
                        <span className={styles.noTags}>—</span>
                      )}
                      {c.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.chip}>{tag}</span>
                      ))}
                      {c.tags.length > 3 && (
                        <span className={styles.chipMore}>+{c.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
