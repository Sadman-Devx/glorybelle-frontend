'use client';

import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/admin/Button';
import ImageUploader from '@/components/admin/ImageUploader';
import { adminProductsApi, type AdminMediaAsset } from '@/lib/adminProducts';
import styles from './MediaPicker.module.css';

export type MediaAssetSelection = Pick<
  AdminMediaAsset,
  'id' | 'url_400' | 'url_800' | 'url_1600' | 'alt_text'
>;

export default function MediaPicker({
  label,
  selected,
  onSelect,
  disabled = false,
}: {
  label: string;
  selected: MediaAssetSelection | null;
  onSelect: (asset: AdminMediaAsset) => void;
  disabled?: boolean;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      adminProductsApi.listMedia(search, page).then((response) => {
        if (!active) return;
        setAssets(response.results);
        setCount(response.count);
      }).catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Non è stato possibile caricare la libreria media.');
        }
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, page, search]);

  function handleUpload(asset: AdminMediaAsset) {
    setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    setCount((current) => current + 1);
    setPage(1);
    setSearch('');
    setUploadNotice(true);
  }

  return (
    <div className={styles.picker}>
      <span className={styles.label}>{label}</span>
      {selected ? (
        <div className={styles.selected}>
          <Image
            src={selected.url_400}
            alt={selected.alt_text || `Immagine ${selected.id}`}
            width={54}
            height={54}
            unoptimized
            loading="lazy"
          />
          <span>{selected.alt_text || `Immagine ${selected.id}`}</span>
        </div>
      ) : (
        <p className={styles.empty}>Nessuna immagine selezionata.</p>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Chiudi libreria' : 'Scegli dalla libreria'}
      </Button>

      {open && (
        <section className={styles.panel} id={panelId} aria-label={label}>
          <div className={styles.panelHeading}>
            <h3>Libreria media</h3>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Chiudi
            </Button>
          </div>
          <label className={styles.search}>
            <span>Cerca immagini</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                setPage(1);
                setUploadNotice(false);
              }}
            />
          </label>
          <ImageUploader onUploaded={handleUpload} disabled={disabled} />
          {uploadNotice && (
            <p className={styles.notice} role="status">
              Immagine caricata. Selezionala dalla libreria.
            </p>
          )}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {loading ? (
            <p className={styles.status} role="status">Caricamento immagini…</p>
          ) : assets.length ? (
            <div className={styles.grid} aria-label="Immagini disponibili">
              {assets.map((asset) => (
                <button
                  type="button"
                  className={styles.asset}
                  key={asset.id}
                  aria-pressed={selected?.id === asset.id}
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                >
                  <Image
                    src={asset.url_400}
                    alt=""
                    width={400}
                    height={400}
                    unoptimized
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <span>{asset.alt_text || `Immagine ${asset.id}`}</span>
                </button>
              ))}
            </div>
          ) : !error ? (
            <p className={styles.status}>Nessuna immagine trovata.</p>
          ) : null}
          <div className={styles.pagination}>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Precedente
            </Button>
            <span>{page} / {Math.max(1, Math.ceil(count / 24))}</span>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page >= Math.ceil(count / 24)}
              onClick={() => setPage((value) => value + 1)}
            >
              Successiva
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
