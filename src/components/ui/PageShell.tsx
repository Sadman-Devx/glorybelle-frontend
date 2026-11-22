import type { ReactNode } from 'react';
import styles from './PageShell.module.css';

interface PageShellProps {
  children: ReactNode;
  /** Narrow reading width (about, privacy, shipping). */
  narrow?: boolean;
}

/** Standard page wrapper: consistent top/bottom spacing + optional reading width. */
export default function PageShell({ children, narrow = false }: PageShellProps) {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={narrow ? styles.narrow : undefined}>{children}</div>
      </div>
    </div>
  );
}
