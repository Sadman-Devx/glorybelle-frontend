'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Button from './Button';
import EmptyState from './EmptyState';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  pageSize = 25,
  emptyTitle = 'Nessun dato',
  emptyMessage = 'Non ci sono elementi da mostrare.',
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  pageSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left ?? '').localeCompare(String(right ?? ''), 'it', { numeric: true });
      return ascending ? comparison : -comparison;
    });
  }, [ascending, rows, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);

  function sortBy(key: keyof T) {
    if (sortKey === key) setAscending((current) => !current);
    else {
      setSortKey(key);
      setAscending(true);
    }
    setPage(0);
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return (
    <div className={styles.tableWrap}>
      <div className={styles.scrollRegion} role="region" aria-label="Tabella dati" tabIndex={0}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} scope="col" aria-sort={
                  sortKey === column.key ? (ascending ? 'ascending' : 'descending') : 'none'
                }>
                  <button type="button" onClick={() => sortBy(column.key)}>
                    {column.label}
                    <span aria-hidden="true">{sortKey === column.key ? (ascending ? ' ↑' : ' ↓') : ' ↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render ? column.render(row) : String(row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination} aria-label="Paginazione tabella">
        <span>
          {sortedRows.length === 0
            ? '0 risultati'
            : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sortedRows.length)} di ${sortedRows.length}`}
        </span>
        <div className={styles.pageButtons}>
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
            Precedente
          </Button>
          <span aria-current="page">{page + 1} / {pageCount}</span>
          <Button variant="secondary" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)}>
            Successiva
          </Button>
        </div>
      </div>
    </div>
  );
}
