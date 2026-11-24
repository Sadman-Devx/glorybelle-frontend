'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Button from '@/components/admin/Button';
import { adminProductsApi, type AdminMediaAsset } from '@/lib/adminProducts';
import styles from './ImageUploader.module.css';

const maxFileSize = 10 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ImageUploaderProps {
  onUploaded: (asset: AdminMediaAsset) => void;
  disabled?: boolean;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  error: string | null;
  uploading: boolean;
}

function uploadWithProgress(
  url: string,
  method: 'PUT',
  headers: Record<string, string>,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.timeout = 120_000;
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Caricamento non riuscito (HTTP ${request.status}).`));
      }
    };
    request.onerror = () => reject(new Error('Connessione interrotta durante il caricamento.'));
    request.ontimeout = () => reject(new Error('Caricamento scaduto. Controlla la connessione.'));
    request.onabort = () => reject(new Error('Caricamento interrotto.'));
    request.send(file);
  });
}

export default function ImageUploader({
  onUploaded,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  function updateItem(id: string, updates: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (
      item.id === id ? { ...item, ...updates } : item
    )));
  }

  async function upload(item: UploadItem) {
    updateItem(item.id, { uploading: true, error: null, progress: 0 });
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        if (attempt > 0) {
          updateItem(item.id, { progress: 0 });
          await new Promise((resolve) => window.setTimeout(resolve, 400 * attempt));
        }
        const signed = await adminProductsApi.presign(item.file.type, item.file.size);
        await uploadWithProgress(
          signed.upload_url,
          signed.method,
          signed.headers,
          item.file,
          (progress) => updateItem(item.id, { progress }),
        );
        const label = item.file.name.replace(/\.[^.]+$/, '').slice(0, 200);
        const asset = await adminProductsApi.registerUpload(signed.upload_id, label);
        onUploaded(asset);
        updateItem(item.id, { uploading: false, error: null, progress: 100 });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    updateItem(item.id, {
      uploading: false,
      error: lastError instanceof Error
        ? lastError.message
        : 'Caricamento non riuscito. Riprova.',
    });
  }

  function addFiles(files: FileList | File[]) {
    setValidationMessage(null);
    const accepted: UploadItem[] = [];
    const rejected: string[] = [];
    Array.from(files).forEach((file) => {
      if (!allowedTypes.has(file.type)) {
        rejected.push(`${file.name}: usa JPG, PNG o WebP.`);
        return;
      }
      if (file.size < 1 || file.size > maxFileSize) {
        rejected.push(`${file.name}: la dimensione massima è 10 MB.`);
        return;
      }
      accepted.push({
        id: window.crypto.randomUUID(),
        file,
        progress: 0,
        error: null,
        uploading: false,
      });
    });
    if (rejected.length) setValidationMessage(rejected.join(' '));
    setItems((current) => [...current, ...accepted]);
    accepted.forEach((item) => void upload(item));
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) addFiles(event.currentTarget.files);
    event.currentTarget.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) addFiles(event.dataTransfer.files);
  }

  return (
    <div className={styles.uploader}>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={onDrop}
        aria-disabled={disabled}
      >
        <p>Trascina qui le immagini oppure selezionale dal dispositivo.</p>
        <span>JPG, PNG o WebP · massimo 10 MB per file</span>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Scegli immagini
        </Button>
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onInputChange}
          disabled={disabled}
          aria-label="Seleziona immagini da caricare"
        />
      </div>
      {validationMessage && <p className={styles.error} role="alert">{validationMessage}</p>}
      {items.length > 0 && (
        <ul className={styles.queue} aria-label="Stato caricamento immagini">
          {items.map((item) => (
            <li className={styles.queueItem} key={item.id}>
              <div className={styles.fileSummary}>
                <span>{item.file.name}</span>
                <small>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</small>
              </div>
              {item.uploading ? (
                <div
                  className={styles.progress}
                  role="progressbar"
                  aria-label={`Caricamento ${item.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.progress}
                >
                  <span style={{ width: `${item.progress}%` }} />
                  <small>{item.progress}%</small>
                </div>
              ) : item.error ? (
                <div className={styles.retryRow}>
                  <p className={styles.error} role="alert">{item.error}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => void upload(item)}
                  >
                    Riprova
                  </Button>
                </div>
              ) : item.progress === 100 ? (
                <span className={styles.complete} role="status">Caricata</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
