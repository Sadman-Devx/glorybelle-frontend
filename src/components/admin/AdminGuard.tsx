'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Button from './Button';
import EmptyState from './EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import styles from './AdminGuard.module.css';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, authError, retry } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !authError && pathname !== '/admin/login') {
      router.replace('/admin/login?expired=1');
    }
  }, [authError, loading, pathname, router, user]);

  if (pathname === '/admin/login') return children;
  if (loading) {
    return (
      <div className={styles.state} role="status" aria-live="polite">
        <span className={styles.spinner} />
        <span>Verifica della sessione…</span>
      </div>
    );
  }
  if (authError) {
    return (
      <div className={styles.error}>
        <EmptyState
          title="Sessione non verificata"
          description={authError}
          action={<Button variant="secondary" onClick={() => void retry()}>Riprova</Button>}
        />
      </div>
    );
  }
  if (!user) return null;
  return children;
}
