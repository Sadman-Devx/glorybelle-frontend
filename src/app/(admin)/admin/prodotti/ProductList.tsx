'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminProductsApi,
  formatProductMoney,
  type AdminCategory,
  type AdminProduct,
} from '@/lib/adminProducts';
import styles from './page.module.css';

const pageSize = 25;

function getPriceRange(product: AdminProduct) {
  const prices = product.variants
    .filter((variant) => variant.is_active)
    .map((variant) => Number(variant.price))
    .filter(Number.isFinite);
  if (!prices.length) prices.push(Number(product.base_price));
  return [Math.min(...prices), Math.max(...prices)] as const;
}

function getStock(product: AdminProduct) {
  return product.variants.reduce(
    (total, variant) => total + (variant.is_active ? variant.available_stock : 0),
    0,
  );
}

export default function ProductList() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const ordering = params.get('ordering') || '-created_at';
  const canWrite = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('products:write'),
  );
  const canRead = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('products:read'),
  );
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [productToToggle, setProductToToggle] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) next.delete('page');
    const query = next.toString();
    router.replace(`/admin/prodotti${query ? `?${query}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      adminProductsApi.list({
        search: params.get('search') || undefined,
        category: params.get('category') || undefined,
        is_active: params.get('is_active') || undefined,
        page,
        page_size: pageSize,
        ordering,
      }).then((response) => {
        if (!active) return;
        setProducts(response.results);
        setCount(response.count);
      }).catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error
          ? requestError.message
          : 'Non è stato possibile caricare i prodotti.');
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canRead, ordering, page, params, retry]);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    adminProductsApi.categories().then((response) => {
      if (active) setCategories(response.results);
    }).catch((requestError: unknown) => {
      if (active) {
        setCategoryError(requestError instanceof Error
          ? requestError.message
          : 'Non è stato possibile caricare le categorie.');
      }
    });
    return () => {
      active = false;
    };
  }, [canRead, retry]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateUrl({ search: String(formData.get('search') || '') });
  }

  function changeSort(field: string) {
    updateUrl({
      ordering: ordering === field ? `-${field}` : field,
    });
  }

  async function confirmToggle() {
    if (!productToToggle) return;
    setSaving(true);
    try {
      const updated = await adminProductsApi.setActive(
        productToToggle.id,
        !productToToggle.is_active,
      );
      setProducts((current) => current.map((product) => (
        product.id === updated.id ? { ...product, is_active: updated.is_active } : product
      )));
      setProductToToggle(null);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiornare lo stato del prodotto.');
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description="Il tuo ruolo non dispone dei permessi necessari per consultare i prodotti."
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
          <h1>Prodotti</h1>
          <p>Gestisci catalogo, prezzi, varianti e disponibilità.</p>
        </div>
        {canWrite && (
          <Link className={styles.primaryLink} href="/admin/prodotti/nuovo">
            Nuovo prodotto
          </Link>
        )}
      </header>

      <form className={styles.filters} onSubmit={submitSearch} key={params.get('search') || ''}>
        <label className={styles.searchField}>
          <span>Cerca prodotti</span>
          <input
            type="search"
            name="search"
            defaultValue={params.get('search') || ''}
            placeholder="Nome o slug"
          />
        </label>
        <label>
          <span>Categoria</span>
          <select
            value={params.get('category') || ''}
            onChange={(event) => updateUrl({ category: event.currentTarget.value })}
          >
            <option value="">Tutte le categorie</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Stato</span>
          <select
            value={params.get('is_active') || ''}
            onChange={(event) => updateUrl({ is_active: event.currentTarget.value })}
          >
            <option value="">Tutti</option>
            <option value="true">Attivi</option>
            <option value="false">Disattivati</option>
          </select>
        </label>
        <Button type="submit">Cerca</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.replace('/admin/prodotti', { scroll: false })}
        >
          Azzera
        </Button>
      </form>

      {categoryError && <p className={styles.inlineError} role="alert">{categoryError}</p>}
      {error ? (
        <div className={styles.tablePanel} role="alert">
          <EmptyState
            title="Prodotti non disponibili"
            description={error}
            action={(
              <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
                Riprova
              </Button>
            )}
          />
        </div>
      ) : (
        <div className={styles.tablePanel} aria-busy={loading}>
          {loading ? (
            <div className={styles.tableSkeleton} role="status">Caricamento prodotti…</div>
          ) : products.length ? (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Immagine</th>
                      <th scope="col">
                        <button type="button" onClick={() => changeSort('name')}>
                          Nome {ordering === 'name' ? '↑' : ordering === '-name' ? '↓' : '↕'}
                        </button>
                      </th>
                      <th scope="col">Categoria</th>
                      <th scope="col" className={styles.amount}>
                        <button type="button" onClick={() => changeSort('base_price')}>
                          Prezzo {ordering === 'base_price' ? '↑' : ordering === '-base_price' ? '↓' : '↕'}
                        </button>
                      </th>
                      <th scope="col" className={styles.amount}>Scorte</th>
                      <th scope="col">Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const image = product.images.find((item) => item.is_primary)
                        || product.images[0];
                      const [minPrice, maxPrice] = getPriceRange(product);
                      const stock = getStock(product);
                      return (
                        <tr key={product.id}>
                          <td>
                            <Link
                              className={styles.thumbnailLink}
                              href={`/admin/prodotti/${product.id}`}
                              aria-label={`Modifica ${product.name}`}
                            >
                              {image?.image ? (
                                <Image
                                  src={image.image}
                                  alt=""
                                  width={64}
                                  height={64}
                                  unoptimized
                                />
                              ) : (
                                <span className={styles.noImage} aria-hidden="true">GB</span>
                              )}
                            </Link>
                          </td>
                          <td>
                            <Link className={styles.productName} href={`/admin/prodotti/${product.id}`}>
                              {product.name}
                            </Link>
                            <small className={styles.slug}>{product.slug}</small>
                          </td>
                          <td>{product.category_name}</td>
                          <td className={styles.amount}>
                            {minPrice === maxPrice
                              ? formatProductMoney(minPrice)
                              : `${formatProductMoney(minPrice)} – ${formatProductMoney(maxPrice)}`}
                          </td>
                          <td className={styles.amount}>{stock}</td>
                          <td>
                            {canWrite ? (
                              <button
                                type="button"
                                className={styles.statusToggle}
                                aria-label={`${product.is_active ? 'Disattiva' : 'Riattiva'} ${product.name}`}
                                aria-pressed={product.is_active}
                                onClick={() => setProductToToggle(product)}
                              >
                                <Badge tone={product.is_active ? 'success' : 'neutral'}>
                                  {product.is_active ? 'Attivo' : 'Disattivato'}
                                </Badge>
                              </button>
                            ) : (
                              <Badge tone={product.is_active ? 'success' : 'neutral'}>
                                {product.is_active ? 'Attivo' : 'Disattivato'}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
              title="Nessun prodotto trovato"
              description="Modifica i filtri o la ricerca per visualizzare altri prodotti."
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={productToToggle !== null}
        title={productToToggle?.is_active ? 'Disattivare il prodotto?' : 'Riattivare il prodotto?'}
        description={productToToggle?.is_active
          ? 'Il prodotto non sarà più acquistabile. Se è presente in un ordine, resterà conservato per proteggere lo storico e i riferimenti degli articoli; non verrà eliminato.'
          : 'Il prodotto tornerà visibile nel catalogo e potrà essere acquistato.'}
        confirmLabel={productToToggle?.is_active ? 'Disattiva prodotto' : 'Riattiva prodotto'}
        confirmDisabled={saving}
        pending={saving}
        onConfirm={() => void confirmToggle()}
        onCancel={() => {
          if (!saving) setProductToToggle(null);
        }}
      />
    </div>
  );
}
