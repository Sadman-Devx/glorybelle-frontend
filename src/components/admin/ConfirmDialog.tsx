'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Conferma',
  confirmDisabled = false,
  pending = false,
  children,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  pending?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      {children}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
        <Button
          type="button"
          variant="danger"
          disabled={confirmDisabled || pending}
          onClick={onConfirm}
        >
          {pending ? 'Attendi…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
