import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductEditor from '../ProductEditor';

export const metadata: Metadata = {
  title: 'Modifica prodotto',
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isSafeInteger(productId) || productId < 1) notFound();

  return <ProductEditor productId={productId} />;
}
