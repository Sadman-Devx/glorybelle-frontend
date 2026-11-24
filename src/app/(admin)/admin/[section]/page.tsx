import { notFound } from 'next/navigation';
import AdminSectionContent from '@/components/admin/AdminSectionContent';

const sections: Record<string, { title: string; permission: string }> = {
  ordini: { title: 'Ordini', permission: 'orders:read' },
  prodotti: { title: 'Prodotti', permission: 'products:read' },
  media: { title: 'Media', permission: 'media:read' },
  richieste: { title: 'Richieste', permission: 'enquiries:read' },
  contenuti: { title: 'Contenuti', permission: 'content:read' },
  utenti: { title: 'Utenti', permission: 'users:read' },
};

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sectionInfo = sections[section];
  if (!sectionInfo) notFound();

  return <AdminSectionContent title={sectionInfo.title} permission={sectionInfo.permission} />;
}
