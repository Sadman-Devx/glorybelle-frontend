'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminEnquiriesApi } from '@/lib/adminEnquiries';
import Badge from './Badge';
import Button from './Button';
import AdminGuard from './AdminGuard';
import styles from './AdminShell.module.css';

type AdminNavItem = {
  href: string;
  label: string;
  permission?: string;
};

const navigation: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/ordini', label: 'Ordini', permission: 'orders:read' },
  { href: '/admin/prodotti', label: 'Prodotti', permission: 'products:read' },
  { href: '/admin/media', label: 'Media', permission: 'media:read' },
  { href: '/admin/richieste', label: 'Richieste', permission: 'enquiries:read' },
  { href: '/admin/contenuti', label: 'Contenuti', permission: 'content:read' },
  { href: '/admin/utenti', label: 'Utenti', permission: 'users:read' },
];

const roleLabels = {
  superuser: 'Superuser',
  manager: 'Manager',
  viewer: 'Viewer',
} as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, logoutEverywhere } = useAdminAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newEnquiryCount, setNewEnquiryCount] = useState<number | null>(null);
  const [newEnquiryCountError, setNewEnquiryCountError] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isLoginPage = pathname === '/admin/login';
  const canReadEnquiries = Boolean(
    user?.permissions.includes('*') || user?.permissions.includes('enquiries:read'),
  );

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    if (!canReadEnquiries) return;

    let active = true;
    const refreshCount = async () => {
      try {
        const count = await adminEnquiriesApi.newCount();
        if (active) {
          setNewEnquiryCount(count);
          setNewEnquiryCountError(false);
        }
      } catch {
        if (active) {
          setNewEnquiryCount(null);
          setNewEnquiryCountError(true);
        }
      }
    };

    void refreshCount();
    const interval = window.setInterval(() => void refreshCount(), 60_000);
    window.addEventListener('admin:enquiries-updated', refreshCount);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('admin:enquiries-updated', refreshCount);
    };
  }, [canReadEnquiries]);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Admin logout request failed.', error);
    } finally {
      router.replace('/admin/login');
    }
  }

  async function handleLogoutEverywhere() {
    try {
      await logoutEverywhere();
    } catch (error) {
      console.error('Admin global logout request failed.', error);
    } finally {
      router.replace('/admin/login');
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  if (isLoginPage) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  const visibleNavigation = navigation.filter((item) => (
    !item.permission
    || user?.permissions.includes('*')
    || user?.permissions.includes(item.permission)
  ));

  return (
    <AdminGuard>
      <div className={styles.app}>
        <header className={styles.topbar}>
          <div className={styles.brandArea}>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              aria-label={drawerOpen ? 'Chiudi menu' : 'Apri menu'}
              aria-expanded={drawerOpen}
              aria-controls="admin-navigation"
              onClick={() => setDrawerOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            <Link href="/admin" className={styles.brand}>GLORYBELLE</Link>
            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.adminLabel}>Atelier · Gestione</span>
          </div>
          <div className={styles.account}>
            {user && (
              <>
                <div className={styles.accountText}>
                  <span>{user.name}</span>
                  <Badge tone={user.role === 'superuser' ? 'gold' : 'neutral'}>
                    {roleLabels[user.role]}
                  </Badge>
                </div>
                <Button variant="secondary" onClick={() => void handleLogout()}>
                  Esci
                </Button>
              </>
            )}
          </div>
        </header>

        <div className={styles.frame}>
          {drawerOpen && (
            <button
              type="button"
              className={styles.scrim}
              aria-label="Chiudi navigazione"
              onClick={closeDrawer}
            />
          )}
          <aside
            id="admin-navigation"
            className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ''}`}
            aria-label="Navigazione amministrazione"
          >
            <div className={styles.sidebarHeading}>
              <p className={styles.navCaption}>Sezioni</p>
              <button
                type="button"
                className={styles.sidebarClose}
                aria-label="Chiudi navigazione"
                onClick={closeDrawer}
              >
                ×
              </button>
            </div>
            <nav>
              <ul className={styles.navList}>
                {visibleNavigation.map((item) => {
                  const active = item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.navLink} ${active ? styles.active : ''}`}
                        aria-current={active ? 'page' : undefined}
                        onClick={closeDrawer}
                      >
                        <span className={styles.navMark} aria-hidden="true" />
                        {item.label}
                        {item.href === '/admin/richieste' && newEnquiryCount !== null && newEnquiryCount > 0 && (
                          <span
                            className={styles.navCount}
                            aria-label={`${newEnquiryCount} nuove richieste`}
                            aria-live="polite"
                          >
                            {newEnquiryCount > 99 ? '99+' : newEnquiryCount}
                          </span>
                        )}
                        {item.href === '/admin/richieste' && newEnquiryCountError && (
                          <span
                            className={styles.navCountError}
                            aria-label="Conteggio delle nuove richieste non disponibile"
                            title="Conteggio delle nuove richieste non disponibile"
                          >
                            !
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className={styles.sidebarFoot}>
              <span>Spazio riservato al team GLORYBELLE</span>
              <Button
                className={styles.logoutEverywhere}
                variant="secondary"
                onClick={() => void handleLogoutEverywhere()}
              >
                Esci da tutti i dispositivi
              </Button>
            </div>
          </aside>

          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
