'use client';

import Badge from './Badge';
import EmptyState from './EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import styles from './AdminSectionContent.module.css';

export default function AdminSectionContent({
  title,
  permission,
}: {
  title: string;
  permission: string;
}) {
  const { user } = useAdminAuth();
  const allowed = user?.permissions.includes('*') || user?.permissions.includes(permission);

  if (!allowed) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description="Il tuo ruolo non dispone dei permessi necessari per questa sezione."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>{title}</h1>
        </div>
        <Badge tone="gold">In preparazione</Badge>
      </header>
      <div className={styles.panel}>
        <EmptyState
          title={`${title}: sezione in preparazione`}
          description="La struttura è pronta. I dati e le azioni saranno disponibili quando verranno collegate le API amministrative."
        />
      </div>
    </div>
  );
}
