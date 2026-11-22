'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { wishlist as wishlistApi } from '@/lib/api';
import type { WishlistItem } from '@/lib/types';

interface WishlistContextType {
  items: WishlistItem[];
  productIds: Set<number>;
  loading: boolean;
  toggle: (productId: number) => Promise<boolean>;
  remove: (productId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setIsAuthenticated] = useState(false);

  // Check if user is authenticated (has access token)
  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('gb_access_token');
    return !!token;
  }, []);

  // Fetch wishlist only when authenticated
  const refresh = useCallback(async () => {
    if (!checkAuth()) {
      setItems([]);
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);
    setLoading(true);
    try {
      const data = await wishlistApi.list();
      setItems(Array.isArray(data) ? data : (data as { results?: WishlistItem[] })?.results ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timer);
  }, [refresh]);

  const toggle = useCallback(async (productId: number): Promise<boolean> => {
    if (!checkAuth()) {
      // Not authenticated — redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?next=/wishlist';
      }
      return false;
    }
    try {
      const result = await wishlistApi.toggle(productId);
      const wishlisted = (result as { wishlisted?: boolean }).wishlisted ?? true;
      if (wishlisted) {
        // Added — fetch full wishlist to get the new item
        await refresh();
      } else {
        // Removed — filter out locally
        setItems(prev => prev.filter(item => item.product.id !== productId));
      }
      return wishlisted;
    } catch {
      return false;
    }
  }, [checkAuth, refresh]);

  const remove = useCallback(async (productId: number) => {
    if (!checkAuth()) return;
    try {
      await wishlistApi.toggle(productId);
      setItems(prev => prev.filter(item => item.product.id !== productId));
    } catch {
      // ignore
    }
  }, [checkAuth]);

  const productIds = new Set(items.map(item => item.product.id));

  return (
    <WishlistContext.Provider value={{ items, productIds, loading, toggle, remove, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
