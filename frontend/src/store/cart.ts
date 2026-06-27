import { create } from 'zustand';

type CartItem = {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant: number | null;
  variant_label: string;
  quantity: number;
  price: string;
  total_price: string;
};

type CartStore = {
  items: CartItem[];
  subtotal: string;
  total: string;
  coupon: { code: string; discount_percent: number } | null;
  setCart: (data: any) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  subtotal: '0',
  total: '0',
  coupon: null,
  setCart: (data) =>
    set({ items: data.items, subtotal: data.subtotal, total: data.total }),
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  updateQuantity: (id, qty) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: qty, total_price: (parseFloat(i.price) * qty).toFixed(2) } : i
      ),
    })),
  clearCart: () => set({ items: [], subtotal: '0', total: '0', coupon: null }),
}));
