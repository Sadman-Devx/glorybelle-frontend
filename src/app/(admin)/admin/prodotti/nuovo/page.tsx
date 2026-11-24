import type { Metadata } from 'next';
import ProductEditor from '../ProductEditor';

export const metadata: Metadata = {
  title: 'Nuovo prodotto',
};

export default function NewProductPage() {
  return <ProductEditor />;
}
