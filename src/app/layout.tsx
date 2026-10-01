import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/contexts/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import Toast from '@/components/ui/Toast';
import ConciergeChat from '@/components/chat/ConciergeChat';
import '@/styles/globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GLORYBELLE | Gioielleria Artigianale Italiana',
  description: 'Gioielli artigianali italiani in oro 18K e argento 925. Anelli, collane, orecchini e bracciali realizzati a mano con pietre preziose.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <Toast />
          <ConciergeChat />
        </CartProvider>
      </body>
    </html>
  );
}
