import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/lib/hooks/useWishlist';
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glorybelle.it';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GLORYBELLE | Gioielleria Artigianale Italiana',
    template: '%s | GLORYBELLE',
  },
  description: 'Gioielli artigianali italiani in oro 18K e argento 925. Anelli, collane, orecchini e bracciali realizzati a mano con pietre preziose.',
  keywords: ['gioielli italiani', 'oro 18K', 'argento 925', 'anelli', 'collane', 'orecchini', 'bracciali', 'artigianato'],
  authors: [{ name: 'GLORYBELLE' }],
  creator: 'GLORYBELLE',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: siteUrl,
    siteName: 'GLORYBELLE',
    title: 'GLORYBELLE | Gioielleria Artigianale Italiana',
    description: 'Gioielli artigianali italiani in oro 18K e argento 925. Ogni pezzo è realizzato a mano con pietre tracciabili.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GLORYBELLE | Gioielleria Artigianale Italiana',
    description: 'Gioielli artigianali italiani in oro 18K e argento 925.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport = {
  themeColor: '#132F26',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${fraunces.variable} ${manrope.variable}`} data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <CartDrawer />
              <Toast />
              <ConciergeChat />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>

        {/* Plausible analytics — cookie-less, no consent banner needed (PRD §3.8) */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
