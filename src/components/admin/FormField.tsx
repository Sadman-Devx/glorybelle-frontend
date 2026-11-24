import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './FormField.module.css';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export default function FormField({
  id,
  label,
  error,
  hint,
  className = '',
  ...inputProps
}: FormFieldProps) {
  const inputId = id ?? inputProps.name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles.invalid : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />
      {hint && <span className={styles.hint} id={hintId}>{hint}</span>}
      {error && <span className={styles.error} id={errorId}>{error}</span>}
    </div>
  );
}
