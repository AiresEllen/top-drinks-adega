import { create } from "zustand";

type CartItem = {
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  increaseItem: (name: string) => void;
  decreaseItem: (name: string) => void;
  removeItem: (name: string) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  clearCart: () => set({ items: [], isOpen: false }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.name === item.name);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }

      return {
        items: [...state.items, { ...item, quantity: 1 }],
      };
    }),

  increaseItem: (name) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.name === name ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    })),

  decreaseItem: (name) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.name === name ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    })),

  removeItem: (name) =>
    set((state) => ({
      items: state.items.filter((i) => i.name !== name),
    })),
}));
