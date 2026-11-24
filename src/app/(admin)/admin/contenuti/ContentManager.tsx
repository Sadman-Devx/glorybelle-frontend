'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import MediaPicker, { type MediaAssetSelection } from '@/components/admin/MediaPicker';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminSiteContentApi,
  type AdminHeroImage,
  type AdminTestimonial,
  type AdminTestimonialWrite,
} from '@/lib/adminSiteContent';
import type { AdminMediaAsset } from '@/lib/adminProducts';
import styles from './page.module.css';

type ContentTab = 'hero' | 'instagram' | 'testimonials';
type TestimonialDraft = {
  name: string;
  quote: string;
  photo: MediaAssetSelection | null;
  active: boolean;
};

const pageSize = 25;

export default function ContentManager() {
  const { user } = useAdminAuth();
  const [tab, setTab] = useState<ContentTab>('hero');
  const canRead = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('content:read'),
  );
  const canWrite = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('content:write'),
  );

  if (!canRead) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description="Il tuo ruolo non dispone dei permessi necessari per gestire i contenuti."
        />
      </div>
    );
  }

  const tabs: { id: ContentTab; label: string }[] = [
    { id: 'hero', label: 'Hero' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'testimonials', label: 'Testimonianze' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>Contenuti del sito</h1>
          <p>Gestisci le immagini e le testimonianze mostrate nelle pagine del negozio.</p>
        </div>
        <Badge tone={canWrite ? 'gold' : 'neutral'}>
          {canWrite ? 'Modifica contenuti' : 'Sola lettura'}
        </Badge>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Sezioni contenuti">
        {tabs.map((item) => (
          <button
            type="button"
            role="tab"
            id={`content-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`content-panel-${item.id}`}
            className={`${styles.tab} ${tab === item.id ? styles.tabSelected : ''}`}
            tabIndex={tab === item.id ? 0 : -1}
            key={item.id}
            onKeyDown={(event) => {
              const currentIndex = tabs.findIndex((entry) => entry.id === tab);
              let nextIndex = currentIndex;
              if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
              if (event.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
              }
              if (event.key === 'Home') nextIndex = 0;
              if (event.key === 'End') nextIndex = tabs.length - 1;
              if (nextIndex !== currentIndex) {
                event.preventDefault();
                const nextTab = tabs[nextIndex];
                setTab(nextTab.id);
                window.setTimeout(() => {
                  document.getElementById(`content-tab-${nextTab.id}`)?.focus();
                }, 0);
              }
            }}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tabs.map((item) => (
        <section
          role="tabpanel"
          id={`content-panel-${item.id}`}
          aria-labelledby={`content-tab-${item.id}`}
          className={styles.panel}
          hidden={tab !== item.id}
          key={item.id}
        >
          {tab === item.id && item.id === 'hero' && <HeroEditor canWrite={canWrite} />}
          {tab === item.id && item.id === 'instagram' && <InstagramEditor canWrite={canWrite} />}
          {tab === item.id && item.id === 'testimonials' && (
            <TestimonialsEditor canWrite={canWrite} />
          )}
        </section>
      ))}
    </div>
  );
}

function HeroEditor({ canWrite }: { canWrite: boolean }) {
  const [items, setItems] = useState<AdminHeroImage[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminHeroImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminSiteContentApi.heroes(search, page);
      setItems(response.results);
      setCount(response.count);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare le immagini hero.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function addHero(asset: AdminMediaAsset) {
    setPending(true);
    setError(null);
    try {
      await adminSiteContentApi.createHero({ media_asset_id: asset.id, active: true });
      setAdding(false);
      setNotice('Immagine hero aggiunta.');
      await load();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiungere l’immagine.');
    } finally {
      setPending(false);
    }
  }

  async function updateHero(id: number, data: Partial<Pick<AdminHeroImage, 'media_asset_id' | 'sort_order' | 'active'>>) {
    setPending(true);
    setError(null);
    try {
      await adminSiteContentApi.updateHero(id, data);
      setNotice('Immagine hero aggiornata.');
      await load();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiornare l’immagine.');
    } finally {
      setPending(false);
    }
  }

  async function deleteHero() {
    if (!deleteTarget) return;
    setPending(true);
    setError(null);
    try {
      await adminSiteContentApi.deleteHero(deleteTarget.id);
      setDeleteTarget(null);
      setNotice('Immagine hero rimossa.');
      await load();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile rimuovere l’immagine.');
    } finally {
      setPending(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <p>Le immagini attive vengono mostrate in ordine crescente.</p>
        {canWrite && (
          <Button type="button" onClick={() => setAdding((value) => !value)}>
            {adding ? 'Annulla' : 'Aggiungi immagine'}
          </Button>
        )}
      </div>
      <label className={styles.search}>
        <span>Cerca nelle immagini hero</span>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
        />
      </label>

      {adding && canWrite && (
        <div className={styles.card}>
          <h2>Nuova immagine hero</h2>
          <MediaPicker
            label="Immagine da aggiungere"
            selected={null}
            disabled={pending}
            onSelect={(asset) => { void addHero(asset); }}
          />
        </div>
      )}

      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? (
        <p className={styles.status} role="status">Caricamento immagini…</p>
      ) : items.length ? (
        <div className={styles.collection}>
          {items.map((item) => (
            <article className={styles.card} key={item.id}>
              <div className={styles.cardHeading}>
                <h2>Immagine {item.id}</h2>
                <Badge tone={item.active ? 'success' : 'neutral'}>
                  {item.active ? 'Attiva' : 'Nascosta'}
                </Badge>
              </div>
              <MediaPicker
                label="Immagine hero"
                selected={item.media}
                disabled={!canWrite || pending}
                onSelect={(asset) => {
                  void updateHero(item.id, { media_asset_id: asset.id });
                }}
              />
              <label className={styles.field}>
                <span>Ordine</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.sort_order}
                  disabled={!canWrite || pending}
                  onChange={(event) => {
                    const value = Number(event.currentTarget.value);
                    setItems((current) => current.map((hero) => (
                      hero.id === item.id ? { ...hero, sort_order: value } : hero
                    )));
                  }}
                  onBlur={() => {
                    if (Number.isInteger(item.sort_order) && item.sort_order >= 0) {
                      void updateHero(item.id, { sort_order: item.sort_order });
                    } else {
                      void load();
                    }
                  }}
                />
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={item.active}
                  disabled={!canWrite || pending}
                  onChange={(event) => {
                    void updateHero(item.id, { active: event.currentTarget.checked });
                  }}
                />
                <span>Mostra sul sito</span>
              </label>
              {canWrite && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => setDeleteTarget(item)}
                >
                  Rimuovi immagine
                </Button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.status}>Nessuna immagine hero trovata.</p>
      )}
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Rimuovere l’immagine hero?"
        description="L’immagine non sarà più mostrata sul sito. Il file resterà nella libreria media."
        confirmLabel="Rimuovi"
        confirmDisabled={pending}
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void deleteHero()}
      />
    </div>
  );
}

function InstagramEditor({ canWrite }: { canWrite: boolean }) {
  const [link, setLink] = useState('https://www.instagram.com/');
  const [images, setImages] = useState<(MediaAssetSelection | null)[]>(Array(7).fill(null));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      adminSiteContentApi.instagram().then((content) => {
        if (!active) return;
        setLink(content.link);
        setImages(Array.from({ length: 7 }, (_, index) => (
          content.images[index]?.media ?? null
        )));
      }).catch((requestError: unknown) => {
        if (active) {
          setLoadError(requestError instanceof Error
            ? requestError.message
            : 'Non è stato possibile caricare la griglia Instagram.');
        }
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [retryToken]);

  async function saveInstagram(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const content = await adminSiteContentApi.saveInstagram(
        link,
        images.map((image) => image?.id ?? null),
      );
      setImages(Array.from({ length: 7 }, (_, index) => (
        content.images[index]?.media ?? null
      )));
      setNotice('Griglia Instagram salvata.');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile salvare la griglia Instagram.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.editor}>
      <p className={styles.help}>
        La griglia viene pubblicata solo dopo aver selezionato sette immagini diverse.
        Fino ad allora il sito mantiene le immagini predefinite.
      </p>
      {loading ? (
        <p className={styles.status} role="status">Caricamento griglia…</p>
      ) : loadError ? (
        <div>
          <p className={styles.error} role="alert">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRetryToken((value) => value + 1)}
          >
            Riprova
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={(event) => void saveInstagram(event)}>
          <label className={styles.field}>
            <span>Link Instagram</span>
            <input
              type="url"
              required
              value={link}
              disabled={!canWrite || pending}
              onChange={(event) => setLink(event.currentTarget.value)}
            />
          </label>
          <div className={styles.instagramGrid}>
            {images.map((image, index) => (
              <div className={styles.slot} key={index}>
                <h2>Immagine {index + 1}</h2>
                <MediaPicker
                  label={`Immagine Instagram ${index + 1}`}
                  selected={image}
                  disabled={!canWrite || pending}
                  onSelect={(asset) => {
                    setImages((current) => current.map((item, slot) => (
                      slot === index ? asset : item
                    )));
                  }}
                />
                {canWrite && image && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      setImages((current) => current.map((item, slot) => (
                        slot === index ? null : item
                      )));
                    }}
                  >
                    Rimuovi immagine
                  </Button>
                )}
              </div>
            ))}
          </div>
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {canWrite && (
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvataggio…' : 'Salva griglia'}
            </Button>
          )}
        </form>
      )}
    </div>
  );
}

function TestimonialsEditor({ canWrite }: { canWrite: boolean }) {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [drafts, setDrafts] = useState<Record<number, TestimonialDraft>>({});
  const [newDraft, setNewDraft] = useState<TestimonialDraft>({
    name: '',
    quote: '',
    photo: null,
    active: true,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTestimonial | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminSiteContentApi.testimonials(search, page);
      setItems(response.results);
      setCount(response.count);
      const nextDrafts: Record<number, TestimonialDraft> = {};
      response.results.forEach((item) => {
        nextDrafts[item.id] = {
          name: item.name,
          quote: item.quote,
          photo: item.photo,
          active: item.active,
        };
      });
      setDrafts(nextDrafts);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare le testimonianze.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateDraft(id: number, changes: Partial<TestimonialDraft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...changes },
    }));
  }

  async function createTestimonial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newDraft.photo) {
      setError('Seleziona una foto per la testimonianza.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const data: AdminTestimonialWrite = {
        name: newDraft.name.trim(),
        quote: newDraft.quote.trim(),
        photo_asset_id: newDraft.photo.id,
        active: newDraft.active,
      };
      await adminSiteContentApi.createTestimonial(data);
      setNewDraft({ name: '', quote: '', photo: null, active: true });
      setPage(1);
      setNotice('Testimonianza aggiunta.');
      await load();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiungere la testimonianza.');
    } finally {
      setPending(false);
    }
  }

  async function saveTestimonial(item: AdminTestimonial) {
    const draft = drafts[item.id];
    if (!draft?.photo) {
      setError('Seleziona una foto per la testimonianza.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await adminSiteContentApi.updateTestimonial(item.id, {
        name: draft.name.trim(),
        quote: draft.quote.trim(),
        photo_asset_id: draft.photo.id,
        active: draft.active,
      });
      setNotice('Testimonianza aggiornata.');
      await load();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiornare la testimonianza.');
    } finally {
      setPending(false);
    }
  }

  async function deleteTestimonial() {
    if (!deleteTarget) return;
    setPending(true);
    setError(null);
    try {
      await adminSiteContentApi.deleteTestimonial(deleteTarget.id);
      setDeleteTarget(null);
      setNotice('Testimonianza rimossa.');
      await load();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile rimuovere la testimonianza.');
    } finally {
      setPending(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className={styles.editor}>
      {canWrite && (
        <form className={styles.card} onSubmit={(event) => void createTestimonial(event)}>
          <h2>Nuova testimonianza</h2>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                required
                maxLength={120}
                value={newDraft.name}
                disabled={pending}
                onChange={(event) => setNewDraft((draft) => ({
                  ...draft,
                  name: event.currentTarget.value,
                }))}
              />
            </label>
            <label className={styles.field}>
              <span>Testimonianza</span>
              <textarea
                required
                maxLength={2000}
                rows={4}
                value={newDraft.quote}
                disabled={pending}
                onChange={(event) => setNewDraft((draft) => ({
                  ...draft,
                  quote: event.currentTarget.value,
                }))}
              />
            </label>
          </div>
          <MediaPicker
            label="Foto della testimonianza"
            selected={newDraft.photo}
            disabled={pending}
            onSelect={(asset) => setNewDraft((draft) => ({ ...draft, photo: asset }))}
          />
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={newDraft.active}
              disabled={pending}
              onChange={(event) => setNewDraft((draft) => ({
                ...draft,
                active: event.currentTarget.checked,
              }))}
            />
            <span>Pubblica sul sito</span>
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvataggio…' : 'Aggiungi testimonianza'}
          </Button>
        </form>
      )}

      <label className={styles.search}>
        <span>Cerca testimonianze</span>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
        />
      </label>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? (
        <p className={styles.status} role="status">Caricamento testimonianze…</p>
      ) : items.length ? (
        <div className={styles.collection}>
          {items.map((item) => {
            const draft = drafts[item.id] ?? {
              name: item.name,
              quote: item.quote,
              photo: item.photo,
              active: item.active,
            };
            return (
              <form
                className={styles.card}
                key={item.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveTestimonial(item);
                }}
              >
                <div className={styles.cardHeading}>
                  <h2>{item.name}</h2>
                  <Badge tone={draft.active ? 'success' : 'neutral'}>
                    {draft.active ? 'Attiva' : 'Nascosta'}
                  </Badge>
                </div>
                <div className={styles.fields}>
                  <label className={styles.field}>
                    <span>Nome</span>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={draft.name}
                      disabled={!canWrite || pending}
                      onChange={(event) => updateDraft(item.id, {
                        name: event.currentTarget.value,
                      })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Testimonianza</span>
                    <textarea
                      required
                      maxLength={2000}
                      rows={4}
                      value={draft.quote}
                      disabled={!canWrite || pending}
                      onChange={(event) => updateDraft(item.id, {
                        quote: event.currentTarget.value,
                      })}
                    />
                  </label>
                </div>
                <MediaPicker
                  label="Foto della testimonianza"
                  selected={draft.photo}
                  disabled={!canWrite || pending}
                  onSelect={(asset) => updateDraft(item.id, { photo: asset })}
                />
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={draft.active}
                    disabled={!canWrite || pending}
                    onChange={(event) => updateDraft(item.id, {
                      active: event.currentTarget.checked,
                    })}
                  />
                  <span>Pubblica sul sito</span>
                </label>
                {canWrite && (
                  <div className={styles.actions}>
                    <Button type="submit" disabled={pending}>
                      Salva modifiche
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={pending}
                      onClick={() => setDeleteTarget(item)}
                    >
                      Rimuovi
                    </Button>
                  </div>
                )}
              </form>
            );
          })}
        </div>
      ) : (
        <p className={styles.status}>Nessuna testimonianza trovata.</p>
      )}
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Rimuovere la testimonianza?"
        description="La testimonianza non sarà più disponibile sul sito. La foto resterà nella libreria media."
        confirmLabel="Rimuovi"
        confirmDisabled={pending}
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void deleteTestimonial()}
      />
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className={styles.pagination}>
      <Button
        type="button"
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Precedente
      </Button>
      <span>{page} / {pageCount}</span>
      <Button
        type="button"
        variant="secondary"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Successiva
      </Button>
    </div>
  );
}
