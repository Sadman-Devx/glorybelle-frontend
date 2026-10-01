'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { cart as cartApi } from '@/lib/api';
import type { Cart, CartItem } from '@/lib/types';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  itemCount: number;
  toast: string | null;
}

const CartContext = createContext<CartContextType | null>(null);

function getSessionKey(): string {
  if (typeof window === 'undefined') return '';
  let key = sessionStorage.getItem('gb_session');
  if (!key) {
    key = 'sess_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('gb_session', key);
  }
  return key;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartApi.get(getSessionKey());
      setCart(data);
    } catch {
      // Cart might not exist yet
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (variantId: number, quantity = 1) => {
    setLoading(true);
    try {
      const data = await cartApi.addItem(variantId, quantity, getSessionKey());
      setCart(data);
      setDrawerOpen(true);
      showToast('Aggiunto al carrello');
    } catch {
      showToast('Errore nell\'aggiunta al carrello');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    setLoading(true);
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      setCart(data);
    } catch {
      showToast('Errore nell\'aggiornamento');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const removeItem = useCallback(async (itemId: number) => {
    setLoading(true);
    try {
      const data = await cartApi.removeItem(itemId);
      setCart(data);
      showToast('Rimosso dal carrello');
    } catch {
      showToast('Errore nella rimozione');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const itemCount = cart?.item_count || 0;

  return (
    <CartContext.Provider value={{
      cart, loading, drawerOpen, toast,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem, updateItem, removeItem, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
