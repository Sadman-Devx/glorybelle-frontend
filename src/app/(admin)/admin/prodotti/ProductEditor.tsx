'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import EmptyState from '@/components/admin/EmptyState';
import FormField from '@/components/admin/FormField';
import ImageUploader from '@/components/admin/ImageUploader';
import Toast from '@/components/admin/Toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminProductsApi,
  type AdminCategory,
  type AdminGem,
  type AdminMediaAsset,
  type AdminMetal,
  type AdminProduct,
  type AdminProductImage,
  type AdminVariantWrite,
} from '@/lib/adminProducts';
import styles from './editor.module.css';

const moneyPattern = /^\d+(?:[.,]\d{1,2})?$/;
const metalValues = ['gold', 'rose', 'silver'] as const;
const gemValues = ['diamond', 'emerald', 'ruby', 'sapphire', 'amethyst', 'none'] as const;

const variantSchema = z.object({
  id: z.number().optional(),
  metal: z.enum(metalValues),
  size: z.string().trim().min(1, 'Inserisci la misura.').max(20),
  sku: z.string().trim().min(1, 'Inserisci lo SKU.').max(50),
  price_override: z.string().refine(
    (value) => value === '' || moneyPattern.test(value),
    'Inserisci un prezzo valido.',
  ),
  stock_quantity: z.number().int('Usa un numero intero.').min(0, 'Lo stock non può essere negativo.'),
  is_active: z.boolean(),
});

const productSchema = z.object({
  name: z.string().trim().min(1, 'Inserisci il nome del prodotto.').max(200),
  slug: z.string().trim().max(220, 'Lo slug può contenere al massimo 220 caratteri.'),
  description: z.string().max(10000),
  category: z.number().int().positive('Seleziona una categoria.'),
  base_price: z.string().refine(
    (value) => moneyPattern.test(value),
    'Inserisci un prezzo valido (es. 129,00).',
  ),
  metal: z.enum(metalValues),
  gem: z.enum(gemValues),
  purity: z.string().trim().min(1, 'Inserisci la purezza.').max(20),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  variants: z.array(variantSchema),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface GalleryItem {
  key: string;
  mediaId: number | null;
  image: string;
  altText: string;
  isPrimary: boolean;
}

const metalLabels: Record<AdminMetal, string> = {
  gold: 'Oro 18K',
  rose: 'Oro rosa',
  silver: 'Argento 925',
};

const gemLabels: Record<AdminGem, string> = {
  diamond: 'Diamante',
  emerald: 'Smeraldo',
  ruby: 'Rubino',
  sapphire: 'Zaffiro',
  amethyst: 'Ametista',
  none: 'Nessuna',
};

function moneyInput(value: string) {
  return value.replace(',', '.');
}

function productToForm(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    base_price: product.base_price,
    metal: product.metal,
    gem: product.gem,
    purity: product.purity,
    is_active: product.is_active,
    is_featured: product.is_featured,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      metal: variant.metal,
      size: variant.size,
      sku: variant.sku,
      price_override: variant.price_override ?? '',
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
    })),
  };
}

function productImagesToGallery(images: AdminProductImage[]): GalleryItem[] {
  return images.map((image) => ({
    key: image.media_id === null ? `legacy-${image.id}` : `media-${image.media_id}`,
    mediaId: image.media_id,
    image: image.image || '',
    altText: image.alt_text,
    isPrimary: image.is_primary,
  }));
}

function assetToGallery(asset: AdminMediaAsset): GalleryItem {
  return {
    key: `media-${asset.id}`,
    mediaId: asset.id,
    image: asset.url_800,
    altText: asset.alt_text,
    isPrimary: false,
  };
}

function toVariantWrite(variant: ProductFormValues['variants'][number]): AdminVariantWrite {
  return {
    metal: variant.metal,
    size: variant.size.trim(),
    sku: variant.sku.trim(),
    price_override: variant.price_override.trim()
      ? moneyInput(variant.price_override.trim())
      : null,
    stock_quantity: variant.stock_quantity,
    is_active: variant.is_active,
  };
}

export default function ProductEditor({ productId }: { productId?: number }) {
  const router = useRouter();
  const { user } = useAdminAuth();
  const canWrite = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('products:write'),
  );
  const canRead = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('products:read'),
  );
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [persistedProductId, setPersistedProductId] = useState<number | undefined>(productId);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [initialGallery, setInitialGallery] = useState<GalleryItem[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([]);
  const [variantsChanged, setVariantsChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: 0,
      base_price: '',
      metal: 'gold',
      gem: 'none',
      purity: '18K',
      is_active: true,
      is_featured: false,
      variants: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
    keyName: 'fieldKey',
  });
  const galleryChanged = JSON.stringify(gallery) !== JSON.stringify(initialGallery);
  const hasUnsavedChanges = isDirty || variantsChanged || galleryChanged;

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    try {
      const [categoryResponse, currentProduct] = await Promise.all([
        adminProductsApi.categories(),
        productId ? adminProductsApi.detail(productId) : Promise.resolve(null),
      ]);
      setCategories(categoryResponse.results);
      setProduct(currentProduct);
      setPersistedProductId(currentProduct?.id);
      if (currentProduct) {
        reset(productToForm(currentProduct));
        const nextGallery = productImagesToGallery(currentProduct.images);
        setGallery(nextGallery);
        setInitialGallery(nextGallery);
      } else {
        reset({
          name: '',
          slug: '',
          description: '',
          category: 0,
          base_price: '',
          metal: 'gold',
          gem: 'none',
          purity: '18K',
          is_active: true,
          is_featured: false,
          variants: [],
        });
        setGallery([]);
        setInitialGallery([]);
      }
      setRemovedVariantIds([]);
      setVariantsChanged(false);
    } catch (requestError) {
      setLoadError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare i dati del prodotto.');
    } finally {
      setLoading(false);
    }
  }, [productId, reset]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadData().catch((requestError: unknown) => {
        if (active) {
          setLoadError(requestError instanceof Error
            ? requestError.message
            : 'Non è stato possibile caricare i dati del prodotto.');
        }
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadData, retry]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const guardInternalLinks = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname
        && destination.search === window.location.search) return;
      if (!window.confirm('Hai modifiche non salvate. Vuoi uscire senza salvarle?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    document.addEventListener('click', guardInternalLinks, true);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      document.removeEventListener('click', guardInternalLinks, true);
    };
  }, [hasUnsavedChanges]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.is_active),
    [categories],
  );

  function addUploadedAsset(asset: AdminMediaAsset) {
    setGallery((current) => (
      current.some((item) => item.mediaId === asset.id)
        ? current
        : [...current, assetToGallery(asset)]
    ));
    setToast('Immagine caricata. Salva il prodotto per aggiornare la galleria.');
  }

  function setPrimary(key: string) {
    setGallery((current) => current.map((item) => ({
      ...item,
      isPrimary: item.key === key,
    })));
  }

  function removeGalleryImage(key: string) {
    setGallery((current) => {
      const remaining = current.filter((item) => item.key !== key);
      if (current.find((item) => item.key === key)?.isPrimary && remaining.length) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining;
    });
  }

  function reorderGallery(sourceKey: string, targetKey: string) {
    setGallery((current) => {
      const sourceIndex = current.findIndex((item) => item.key === sourceKey);
      const targetIndex = current.findIndex((item) => item.key === targetKey);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
      const reordered = [...current];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
  }

  function onGalleryDrop(event: DragEvent<HTMLLIElement>, targetKey: string) {
    event.preventDefault();
    if (draggedKey) reorderGallery(draggedKey, targetKey);
    setDraggedKey(null);
  }

  function addVariant() {
    append({
      metal: 'gold',
      size: '',
      sku: '',
      price_override: '',
      stock_quantity: 0,
      is_active: true,
    });
    setVariantsChanged(true);
  }

  function removeVariant(index: number) {
    const id = fields[index]?.id;
    if (typeof id === 'number') {
      setRemovedVariantIds((current) => [...current, id]);
    }
    remove(index);
    setVariantsChanged(true);
  }

  async function save(values: ProductFormValues) {
    setSaveError(null);
    setSuccess(null);
    let savedProduct: AdminProduct | null = null;
    try {
      const productPayload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description,
        category: values.category,
        base_price: moneyInput(values.base_price.trim()),
        metal: values.metal,
        gem: values.gem,
        purity: values.purity.trim(),
        is_active: values.is_active,
        is_featured: values.is_featured,
      };
      const currentProductId = persistedProductId;
      savedProduct = currentProductId
        ? await adminProductsApi.update(currentProductId, productPayload)
        : await adminProductsApi.create(productPayload);
      if (!currentProductId) {
        setProduct(savedProduct);
        setPersistedProductId(savedProduct.id);
      }

      for (const [index, variant] of values.variants.entries()) {
        const payload = toVariantWrite(variant);
        if (variant.id) {
          await adminProductsApi.updateVariant(savedProduct.id, variant.id, payload);
        } else {
          const createdVariant = await adminProductsApi.createVariant(savedProduct.id, payload);
          setValue(`variants.${index}.id`, createdVariant.id, { shouldDirty: false });
        }
      }
      for (const variantId of removedVariantIds) {
        await adminProductsApi.removeVariant(savedProduct.id, variantId);
        setRemovedVariantIds((current) => current.filter((id) => id !== variantId));
      }
      if (galleryChanged) {
        const mediaItems = gallery.filter(
          (item): item is GalleryItem & { mediaId: number } => item.mediaId !== null,
        );
        const primaryMediaId = mediaItems.find((item) => item.isPrimary)?.mediaId ?? null;
        await adminProductsApi.setGallery(
          savedProduct.id,
          mediaItems.map((item) => item.mediaId),
          primaryMediaId,
        );
      }
      setSuccess('Prodotto salvato correttamente.');
      setRemovedVariantIds([]);
      setVariantsChanged(false);
      if (!productId) {
        router.replace(`/admin/prodotti/${savedProduct.id}`);
      } else {
        const latest = await adminProductsApi.detail(savedProduct.id);
        setProduct(latest);
        reset(productToForm(latest));
        const nextGallery = productImagesToGallery(latest.images);
        setGallery(nextGallery);
        setInitialGallery(nextGallery);
      }
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile salvare il prodotto.';
      setSaveError(savedProduct
        ? `Il prodotto è stato salvato, ma una variante o la galleria non è stata aggiornata. ${message}`
        : message);
    }
  }

  function cancelEdit() {
    if (hasUnsavedChanges && !window.confirm('Hai modifiche non salvate. Vuoi uscire senza salvarle?')) {
      return;
    }
    router.push('/admin/prodotti');
  }

  if (!canRead || (!canWrite && !productId)) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description={canRead
            ? 'Il tuo ruolo consente la consultazione, ma non la creazione o modifica dei prodotti.'
            : 'Il tuo ruolo non dispone dei permessi necessari per consultare i prodotti.'}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Caricamento prodotto">
        <div className={styles.skeletonHeading} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  if (loadError || (productId && !product)) {
    return (
      <div className={styles.page} role="alert">
        <EmptyState
          title="Prodotto non disponibile"
          description={loadError || 'Il prodotto richiesto non è stato trovato.'}
          action={(
            <Button variant="secondary" onClick={() => setRetry((current) => current + 1)}>
              Riprova
            </Button>
          )}
        />
      </div>
    );
  }

  const readOnly = !canWrite;

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Catalogo</span>
          <h1>{product ? 'Modifica prodotto' : 'Nuovo prodotto'}</h1>
          <p>
            {product
              ? `Modifica dettagli, varianti e immagini di ${product.name}.`
              : 'Inserisci i dettagli del prodotto artigianale.'}
          </p>
        </div>
        <div className={styles.headingActions}>
          {product && (
            <Badge tone={product.is_active ? 'success' : 'neutral'}>
              {product.is_active ? 'Attivo' : 'Disattivato'}
            </Badge>
          )}
          {hasUnsavedChanges && <span className={styles.unsaved}>Modifiche non salvate</span>}
        </div>
      </header>

      {readOnly && (
        <p className={styles.readOnlyNotice} role="status">
          Modalità di sola lettura: il tuo ruolo non può modificare prodotti o immagini.
        </p>
      )}
      {saveError && <p className={styles.error} role="alert">{saveError}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}

      <form className={styles.form} onSubmit={handleSubmit(save)}>
        <section className={styles.panel} aria-labelledby="details-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="details-heading">Dettagli prodotto</h2>
              <p>Informazioni principali e assegnazione al catalogo.</p>
            </div>
          </div>
          <div className={styles.detailsGrid}>
            <FormField
              label="Nome"
              {...register('name')}
              error={errors.name?.message}
              disabled={readOnly}
              autoComplete="off"
            />
            <FormField
              label="Slug (facoltativo)"
              {...register('slug')}
              error={errors.slug?.message}
              disabled={readOnly}
              hint="Se lasciato vuoto viene generato dal nome."
            />
            <FormField
              label="Prezzo base · EUR"
              inputMode="decimal"
              {...register('base_price')}
              error={errors.base_price?.message}
              disabled={readOnly}
            />
            <label className={styles.field}>
              <span>Categoria</span>
              <select
                {...register('category', { valueAsNumber: true })}
                disabled={readOnly || categories.length === 0}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? 'category-error' : undefined}
              >
                <option value={0}>Seleziona una categoria</option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    disabled={!category.is_active && product?.category !== category.id}
                  >
                    {category.name}{category.is_active ? '' : ' · non attiva'}
                  </option>
                ))}
              </select>
              {errors.category && (
                <small className={styles.fieldError} id="category-error">
                  {errors.category.message}
                </small>
              )}
              {categoryErrorText(categories, activeCategory)}
            </label>
            <label className={styles.field}>
              <span>Metallo predefinito</span>
              <select {...register('metal')} disabled={readOnly}>
                {metalValues.map((metal) => (
                  <option value={metal} key={metal}>{metalLabels[metal]}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Pietra</span>
              <select {...register('gem')} disabled={readOnly}>
                {gemValues.map((gem) => (
                  <option value={gem} key={gem}>{gemLabels[gem]}</option>
                ))}
              </select>
            </label>
            <FormField
              label="Purezza"
              {...register('purity')}
              error={errors.purity?.message}
              disabled={readOnly}
              placeholder="18K"
            />
            <label className={`${styles.field} ${styles.descriptionField}`}>
              <span>Descrizione</span>
              <textarea
                {...register('description')}
                rows={5}
                maxLength={10000}
                disabled={readOnly}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && (
                <small className={styles.fieldError}>{errors.description.message}</small>
              )}
            </label>
            <div className={styles.checkFields}>
              <label>
                <input type="checkbox" {...register('is_active')} disabled={readOnly} />
                <span>Prodotto attivo</span>
              </label>
              <label>
                <input type="checkbox" {...register('is_featured')} disabled={readOnly} />
                <span>In evidenza</span>
              </label>
            </div>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="variants-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="variants-heading">Varianti e scorte</h2>
              <p>Prezzo personalizzato facoltativo; lo stock riservato non è modificabile.</p>
            </div>
            {!readOnly && (
              <Button type="button" variant="secondary" onClick={addVariant}>
                Aggiungi variante
              </Button>
            )}
          </div>
          {fields.length ? (
            <div className={styles.variantScroll}>
              <table className={styles.variantTable}>
                <thead>
                  <tr>
                    <th scope="col">Metallo</th>
                    <th scope="col">Misura</th>
                    <th scope="col">SKU</th>
                    <th scope="col">Prezzo · EUR</th>
                    <th scope="col">Scorte</th>
                    <th scope="col">Attiva</th>
                    {!readOnly && <th scope="col"><span className="sr-only">Azioni</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.fieldKey}>
                      <td>
                        <select
                          {...register(`variants.${index}.metal`)}
                          disabled={readOnly}
                        >
                          {metalValues.map((metal) => (
                            <option value={metal} key={metal}>{metalLabels[metal]}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          {...register(`variants.${index}.size`)}
                          disabled={readOnly}
                          aria-label={`Misura variante ${index + 1}`}
                        />
                        {errors.variants?.[index]?.size && (
                          <small className={styles.fieldError}>{errors.variants[index].size.message}</small>
                        )}
                      </td>
                      <td>
                        <input
                          {...register(`variants.${index}.sku`)}
                          disabled={readOnly}
                          aria-label={`SKU variante ${index + 1}`}
                        />
                        {errors.variants?.[index]?.sku && (
                          <small className={styles.fieldError}>{errors.variants[index].sku.message}</small>
                        )}
                      </td>
                      <td>
                        <input
                          {...register(`variants.${index}.price_override`)}
                          inputMode="decimal"
                          disabled={readOnly}
                          aria-label={`Prezzo variante ${index + 1}`}
                          placeholder="Usa il prezzo base"
                        />
                        {errors.variants?.[index]?.price_override && (
                          <small className={styles.fieldError}>
                            {errors.variants[index].price_override.message}
                          </small>
                        )}
                      </td>
                      <td>
                        <input
                          {...register(`variants.${index}.stock_quantity`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          step="1"
                          disabled={readOnly}
                          aria-label={`Stock variante ${index + 1}`}
                        />
                        {product?.variants.find((variant) => variant.id === field.id) && (
                          <small className={styles.reserved}>
                            Riservate: {product.variants.find((variant) => variant.id === field.id)?.reserved_quantity}
                          </small>
                        )}
                        {errors.variants?.[index]?.stock_quantity && (
                          <small className={styles.fieldError}>
                            {errors.variants[index].stock_quantity.message}
                          </small>
                        )}
                      </td>
                      <td>
                        <input
                          {...register(`variants.${index}.is_active`)}
                          type="checkbox"
                          disabled={readOnly}
                          aria-label={`Variante ${index + 1} attiva`}
                        />
                      </td>
                      {!readOnly && (
                        <td>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeVariant(index)}
                            aria-label={`Rimuovi variante ${index + 1}`}
                          >
                            Rimuovi
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyInline}>Nessuna variante. Il prodotto userà il prezzo base.</p>
          )}
          {errors.variants?.root?.message && (
            <p className={styles.fieldError} role="alert">{errors.variants.root.message}</p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="gallery-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="gallery-heading">Galleria immagini</h2>
              <p>Trascina per riordinare; imposta un’immagine principale per il prodotto.</p>
            </div>
            {gallery.length > 0 && (
              <Badge tone="neutral">{gallery.length} immagini</Badge>
            )}
          </div>
          {!readOnly && (
            <ImageUploader onUploaded={addUploadedAsset} disabled={isSubmitting} />
          )}
          {gallery.length ? (
            <ul className={styles.gallery}>
              {gallery.map((image, index) => (
                <li
                  className={`${styles.galleryItem} ${draggedKey === image.key ? styles.dragging : ''}`}
                  key={image.key}
                  draggable={!readOnly}
                  onDragStart={(event) => {
                    setDraggedKey(image.key);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', image.key);
                  }}
                  onDragEnd={() => setDraggedKey(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onGalleryDrop(event, image.key)}
                >
                  {image.image ? (
                    <Image
                      className={styles.galleryImage}
                      src={image.image}
                      alt={image.altText}
                      width={320}
                      height={320}
                      unoptimized
                    />
                  ) : (
                    <span className={styles.missingImage}>Anteprima non disponibile</span>
                  )}
                  <div className={styles.galleryInfo}>
                    <span>{image.altText || `Immagine ${index + 1}`}</span>
                    {image.mediaId === null && (
                      <small>Immagine legacy: non presente nella libreria media.</small>
                    )}
                    {image.isPrimary && <Badge tone="gold">Principale</Badge>}
                  </div>
                  {!readOnly && (
                    <div className={styles.galleryActions}>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => reorderGallery(image.key, gallery[index - 1].key)}
                          aria-label={`Sposta immagine ${index + 1} prima`}
                        >
                          ↑
                        </Button>
                      )}
                      {index < gallery.length - 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => reorderGallery(image.key, gallery[index + 1].key)}
                          aria-label={`Sposta immagine ${index + 1} dopo`}
                        >
                          ↓
                        </Button>
                      )}
                      {image.mediaId !== null && !image.isPrimary && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setPrimary(image.key)}
                        >
                          Imposta principale
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeGalleryImage(image.key)}
                        aria-label={`Rimuovi immagine ${index + 1} dalla galleria`}
                      >
                        Rimuovi
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyInline}>Nessuna immagine nella galleria.</p>
          )}
        </section>

        <footer className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={cancelEdit}>
            Torna ai prodotti
          </Button>
          {canWrite && (
            <Button type="submit" disabled={isSubmitting || !categories.length}>
              {isSubmitting ? 'Salvataggio…' : 'Salva prodotto'}
            </Button>
          )}
        </footer>
      </form>

      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}

function categoryErrorText(
  categories: AdminCategory[],
  activeCategory: AdminCategory | undefined,
) {
  if (!categories.length) {
    return <small className={styles.fieldError}>Nessuna categoria disponibile. Verifica le categorie amministrative.</small>;
  }
  if (!activeCategory) {
    return <small className={styles.hint}>Seleziona la categoria corretta per questo prodotto.</small>;
  }
  return null;
}
