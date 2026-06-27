import React, { useState, useRef, useEffect } from 'react';
import { useDebounce } from 'hooks/useDebounce';
import type { Cliente } from 'types';
import styles from './ClientSearch.module.css';

interface Props {
  onSelect: (client: Cliente) => void;
  value?: Cliente | null;
}

export function ClientSearch({ onSelect, value }: Props): React.ReactElement {
  const [query, setQuery] = useState(value?.nome ?? '');
  const [results, setResults] = useState<Cliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    fetch(
      `${process.env['REACT_APP_API_URL'] ?? ''}/api/clientes?q=${encodeURIComponent(debouncedQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
      }
    )
      .then((r) => r.json())
      .then((data: { items: Cliente[] }) => {
        setResults(data.items ?? []);
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(client: Cliente) {
    setQuery(client.nome);
    setIsOpen(false);
    onSelect(client);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          id="client-search"
          type="text"
          className={styles.input}
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onSelect(null as unknown as Cliente);
          }}
          autoComplete="off"
          aria-label="Search client"
          aria-owns={isOpen ? 'client-search-dropdown' : undefined}
          aria-autocomplete="list"
        />
        {loading && <span className={styles.spinner} aria-label="Searching" />}
      </div>

      {isOpen && results.length > 0 && (
        <ul id="client-search-dropdown" className={styles.dropdown} role="listbox" aria-label="Search results">
          {results.map((c) => (
            <li
              key={c.id}
              role="option"
              aria-selected={value?.id === c.id}
              className={styles.item}
              onClick={() => handleSelect(c)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(c)}
              tabIndex={0}
            >
              <span className={styles.name}>{c.nome}</span>
              <span className={styles.phone}>{c.telefone}</span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && !loading && (
        <div className={styles.empty}>No clients found.</div>
      )}
    </div>
  );
}
