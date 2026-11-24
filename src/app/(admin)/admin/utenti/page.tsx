import type { Metadata } from 'next';
import UsersManager from './UsersManager';

export const metadata: Metadata = {
  title: 'Utenti staff',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <UsersManager />;
}
