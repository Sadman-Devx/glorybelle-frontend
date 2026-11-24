import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <span className={styles.mark} aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
