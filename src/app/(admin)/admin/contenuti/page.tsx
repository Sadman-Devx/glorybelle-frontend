import type { Metadata } from 'next';
import ContentManager from './ContentManager';

export const metadata: Metadata = {
  title: 'Contenuti',
  robots: { index: false, follow: false },
};

export default function AdminContentPage() {
  return <ContentManager />;
}
