import { create } from 'zustand';
import type { Cart } from '@/lib/types';

interface CartState {
  cart: Cart | null;
  setCart: (cart: Cart | null) => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  setCart: (cart) => set({ cart }),
  itemCount: () => get().cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
}));
