'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/admin/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminProductsApi,
  type AdminMediaAsset,
} from '@/lib/adminProducts';
import styles from './page.module.css';

const pageSize = 24;
const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  dateStyle: 'medium',
});

export default function MediaLibrary() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const search = params.get('search') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const canRead = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('media:read'),
  );
  const canWrite = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('media:write'),
  );
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [assetToDelete, setAssetToDelete] = useState<AdminMediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) next.delete('page');
    const query = next.toString();
    router.replace(`/admin/media${query ? `?${query}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminProductsApi.listMedia(search, page);
      setAssets(response.results);
      setCount(response.count);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare la libreria media.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (!canRead) return;
    const timer = window.setTimeout(() => void loadMedia(), 0);
    return () => window.clearTimeout(timer);
  }, [canRead, loadMedia, retry]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateUrl({ search: String(formData.get('search') || '') });
  }

  async function confirmDelete() {
    if (!assetToDelete || assetToDelete.usage_count > 0) return;
    setDeleting(true);
    setError(null);
    try {
      await adminProductsApi.deleteMedia(assetToDelete.id);
      setAssetToDelete(null);
      setRetry((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile eliminare il file media.');
      setAssetToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!canRead) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description="Il tuo ruolo non dispone dei permessi necessari per consultare i media."
        />
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>Libreria media</h1>
          <p>Immagini ottimizzate condivise tra catalogo e contenuti del sito.</p>
        </div>
        <span className={styles.count}>{count} immagini</span>
      </header>

      <form className={styles.filters} onSubmit={submitSearch} key={search}>
        <label>
          <span>Cerca per testo alternativo</span>
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Descrizione immagine"
          />
        </label>
        <Button type="submit">Cerca</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.replace('/admin/media', { scroll: false })}
        >
          Azzera
        </Button>
      </form>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {loading ? (
        <div className={styles.grid} aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div className={styles.skeletonCard} key={index} />
          ))}
        </div>
      ) : assets.length ? (
        <>
          <ul className={styles.grid} aria-label="Immagini della libreria media">
            {assets.map((asset) => {
              const inUse = asset.usage_count > 0;
              const usageId = `media-usage-${asset.id}`;
              return (
                <li className={styles.card} key={asset.id}>
                  <div className={styles.imageFrame}>
                    <Image
                      src={asset.url_400}
                      alt={asset.alt_text}
                      width={400}
                      height={400}
                      unoptimized
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <strong className={styles.altText}>
                      {asset.alt_text || 'Immagine senza testo alternativo'}
                    </strong>
                    <p className={styles.dimensions}>
                      {asset.width} × {asset.height} px · {(asset.original_size_bytes / 1024).toFixed(0)} KB
                    </p>
                    <p
                      className={inUse ? styles.inUse : styles.unused}
                      id={usageId}
                      title={inUse
                        ? `Utilizzata in ${asset.usage_count} contenuti o prodotti. Rimuovi i collegamenti prima di eliminare.`
                        : 'Non è utilizzata in prodotti o contenuti.'}
                    >
                      {inUse
                        ? `In uso ${asset.usage_count} ${asset.usage_count === 1 ? 'volta' : 'volte'}`
                        : 'Non utilizzata'}
                    </p>
                    <p className={styles.date}>
                      Caricata il {dateFormatter.format(new Date(asset.created_at))}
                    </p>
                    {canWrite && (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={inUse}
                        aria-describedby={usageId}
                        aria-label={inUse
                          ? `Eliminazione non disponibile: ${asset.alt_text || 'immagine'} in uso`
                          : `Elimina ${asset.alt_text || 'immagine'}`}
                        title={inUse
                          ? `Non eliminabile: utilizzata ${asset.usage_count} ${asset.usage_count === 1 ? 'volta' : 'volte'} in prodotti o contenuti.`
                          : 'Elimina questa immagine non utilizzata'}
                        onClick={() => setAssetToDelete(asset)}
                      >
                        Elimina
                      </Button>
                    )}
                    {!canWrite && (
                      <span className={styles.readOnly}>Sola consultazione</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.pagination}>
            <span>
              {count
                ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, count)} di ${count}`
                : '0 risultati'}
            </span>
            <div>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => updateUrl({ page: String(page - 1) })}
              >
                Precedente
              </Button>
              <span>{page} / {pageCount}</span>
              <Button
                variant="secondary"
                disabled={page >= pageCount}
                onClick={() => updateUrl({ page: String(page + 1) })}
              >
                Successiva
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Nessuna immagine trovata"
          description={search
            ? 'Prova a modificare il testo di ricerca.'
            : 'Le immagini caricate appariranno qui.'}
          action={search
            ? <Button variant="secondary" onClick={() => router.replace('/admin/media')}>Azzera ricerca</Button>
            : undefined}
        />
      )}

      <ConfirmDialog
        open={assetToDelete !== null}
        title="Eliminare questa immagine?"
        description="Il file e tutte le sue versioni ottimizzate verranno rimossi definitivamente dalla libreria."
        confirmLabel="Elimina immagine"
        confirmDisabled={Boolean(assetToDelete?.usage_count) || deleting}
        pending={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setAssetToDelete(null);
        }}
      />
    </div>
  );
}
