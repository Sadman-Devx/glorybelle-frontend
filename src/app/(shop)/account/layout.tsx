'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './layout.module.css';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Remember that this visitor WAS signed in, so that logging out (user -> null)
  // is not mistaken for "never signed in" and bounced to /login?next=/account
  // (which would send them straight back here after the next login).
  const wasSignedIn = useRef(false);

  // Auth gate — redirect to /login if not authenticated
  useEffect(() => {
    if (user) {
      wasSignedIn.current = true;
    } else if (!loading && !wasSignedIn.current) {
      router.replace('/login?next=/account');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Caricamento…</p>
      </div>
    );
  }

  if (!user) {
    // Redirecting to /login
    return null;
  }

  return <>{children}</>;
}
