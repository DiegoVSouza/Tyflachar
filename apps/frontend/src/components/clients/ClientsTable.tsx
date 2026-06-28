import React from 'react';
import type { Cliente, client_id } from 'types';
import styles from './ClientsTable.module.css';

interface Props {
  clients: Cliente[];
  total: number;
  isLoading: boolean;
  selectedClientId: client_id | null;
  query: string;
  onSearch: (q: string) => void;
  onSelect: (id: client_id) => void;
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
            placeholder="Pesquisar por nome ou telefone…"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Pesquisar clientes"
          />
        </div>
        <span className={styles.total}>
          {isLoading ? '…' : `${total} cliente${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {isLoading ? (
        <div className={styles.state} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          Carregando clientes…
        </div>
      ) : clients.length === 0 ? (
        <div className={styles.state} role="status">
          <span className={styles.emptyIcon} aria-hidden="true">👤</span>
          <p>{query ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrapper} role="region" aria-label="Lista de clientes">
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th scope="col" className={styles.th}>Cliente</th>
                <th scope="col" className={styles.th}>Telefone</th>
                <th scope="col" className={styles.th}>Registrado</th>
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
