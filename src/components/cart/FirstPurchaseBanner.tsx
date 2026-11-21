'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth as authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './FirstPurchaseBanner.module.css';

interface DiscountInfo {
  eligible: boolean;
  percent: string;
  message: string;
}

/**
 * Quiet, editorial banner shown in the cart drawer for guests + first-time
 * customers. NOT a popup — sits inline above the cart items.
 *
 * Per rule.md §5: discount is positioned as a boutique acquisition incentive
 * (Net-a-Porter style), NOT an aggressive urgency tactic.
 */
export default function FirstPurchaseBanner() {
  const { user } = useAuth();
  const [discount, setDiscount] = useState<DiscountInfo | null>(null);

  useEffect(() => {
    authApi.firstPurchaseDiscount()
      .then(setDiscount)
      .catch(() => setDiscount(null));
  }, [user]);

  if (!discount || !discount.eligible) return null;

  // For authenticated first-time buyers: "Hai diritto al 10% di sconto"
  // For guests: "Register to claim 10% off" — links to /register
  const isAuthenticated = !!user;

  return (
    <div className={styles.banner} role="status">
      <div className={styles.icon} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
          <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
        </svg>
      </div>
      <div className={styles.content}>
        <p className={styles.headline}>
          {isAuthenticated
            ? `Hai diritto al ${discount.percent}% di sconto`
            : `${discount.percent}% di sconto sul primo ordine`}
        </p>
        <p className={styles.sub}>
          {isAuthenticated
            ? 'Lo sconto sarà applicato automaticamente al checkout.'
            : 'Registrati ora per ottenere lo sconto al checkout.'}
        </p>
      </div>
      {!isAuthenticated && (
        <Link href="/register" className={styles.cta}>
          Registrati
        </Link>
      )}
    </div>
  );
}
