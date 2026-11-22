import type { ReactNode } from 'react';
import styles from './Prose.module.css';

/** Readable long-form text: styles h2/h3/p/ul/ol/a for legal and info pages. */
export default function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}
