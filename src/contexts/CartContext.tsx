'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { cart as cartApi, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Cart } from '@/lib/types';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  /** Empty the cart (releases stock reservations). Used after a successful checkout. */
  clearCart: () => Promise<void>;
  itemCount: number;
  toast: string | null;
}

const CartContext = createContext<CartContextType | null>(null);

/** 409 = not enough stock, 410 = reservation expired (see core/exceptions.py). */
function failureMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 409) return 'Articolo non disponibile nella quantità richiesta';
  if (err instanceof ApiError && err.status === 410) return 'La riserva è scaduta. Aggiungi di nuovo l\'articolo';
  return fallback;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  // Load the cart once auth is resolved, and again whenever the user logs in/out.
  //  - guest      -> the cart tied to the browser's session cookie
  //  - logged in  -> merge the guest cart into the account cart (no-op if there is none)
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const data = userId !== null ? await cartApi.merge() : await cartApi.get();
        if (!cancelled) setCart(data);
      } catch {
        // Cart might not exist yet / backend unreachable — keep the previous state
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, userId]);

  const addItem = useCallback(async (variantId: number, quantity = 1) => {
    setLoading(true);
    try {
      const data = await cartApi.addItem(variantId, quantity);
      setCart(data);
      setDrawerOpen(true);
      showToast('Aggiunto al carrello');
    } catch (err) {
      showToast(failureMessage(err, 'Errore nell\'aggiunta al carrello'));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    setLoading(true);
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      setCart(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // The line vanished (reservation expired / cart changed elsewhere): resync
        try { setCart(await cartApi.get()); } catch { /* keep current state */ }
        showToast('Il carrello è stato aggiornato');
      } else {
        showToast(failureMessage(err, 'Errore nell\'aggiornamento'));
      }
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

  const clearCart = useCallback(async () => {
    try {
      setCart(await cartApi.clear());
    } catch {
      // Not fatal — the backend also clears a logged-in user's cart on payment.
    }
  }, []);

  const itemCount = cart?.item_count || 0;

  return (
    <CartContext.Provider value={{
      cart, loading, drawerOpen, toast,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem, updateItem, removeItem, clearCart, itemCount,
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
