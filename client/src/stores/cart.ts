/**
 * cart.ts
 *
 * FIX #1 — subscribes to authEvents instead of being imported by auth.ts.
 * FIX #5 — productId is always stored as a string (product.id from API).
 *           A numeric ID helper `productIdAsNumber()` safely converts it
 *           for the checkout payload, throwing if NaN rather than sending
 *           a silent null to the backend.
 */
import { create }      from "zustand";
import { authEvents }  from "./authEvents";
import type { Product } from "./products";

export interface CartItem {
  productId:       string;   // always stored as string (matches Product.id)
  productName:     string;
  productBrand:    string;
  productImageUrl: string;
  unitPrice:       number;
  quantity:        number;
}

interface CartState {
  items:              CartItem[];
  loadCart:           (userId: string) => void;
  clearCart:          (userId?: string) => void;
  addItem:            (product: Product) => void;
  removeItem:         (productId: string) => void;
  updateQty:          (productId: string, qty: number) => void;
  totalItems:         () => number;
  totalPrice:         () => number;
  /** Safe numeric conversion — throws descriptive error if NaN */
  productIdAsNumber:  (productId: string) => number;
}

const storageKey = (userId: string) => `vsv_cart_${userId}`;
const saveCart   = (userId: string, items: CartItem[]) =>
  localStorage.setItem(storageKey(userId), JSON.stringify(items));

const getCurrentUserId = (): string | null => {
  try {
    return (JSON.parse(localStorage.getItem("user") || "{}").id as string) || null;
  } catch {
    return null;
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  loadCart: (userId) => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      set({ items: raw ? (JSON.parse(raw) as CartItem[]) : [] });
    } catch {
      set({ items: [] });
    }
  },

  clearCart: (userId) => {
    if (userId) localStorage.removeItem(storageKey(userId));
    set({ items: [] });
  },

  addItem: (product) => {
    const userId = getCurrentUserId();
    set((s) => {
      const existing = s.items.find((i) => i.productId === product.id);
      const next: CartItem[] = existing
        ? s.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [
            ...s.items,
            {
              productId:       product.id,          // string
              productName:     product.name,
              productBrand:    product.brand    ?? "",
              productImageUrl: product.imageUrl ?? "",
              unitPrice:       Number(product.price),
              quantity:        1,
            },
          ];
      if (userId) saveCart(userId, next);
      return { items: next };
    });
  },

  removeItem: (productId) => {
    const userId = getCurrentUserId();
    set((s) => {
      const next = s.items.filter((i) => i.productId !== productId);
      if (userId) saveCart(userId, next);
      return { items: next };
    });
  },

  updateQty: (productId, qty) => {
    const userId = getCurrentUserId();
    set((s) => {
      const next =
        qty <= 0
          ? s.items.filter((i) => i.productId !== productId)
          : s.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            );
      if (userId) saveCart(userId, next);
      return { items: next };
    });
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  // FIX #5 — safe numeric conversion
  productIdAsNumber: (productId: string): number => {
    const n = Number(productId);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        `ID produs invalid: "${productId}". Nu se poate converti în număr.`
      );
    }
    return n;
  },
}));

// FIX #1 — subscribe to auth events (no circular import)
authEvents.on("login",  (userId) => {
  if (userId) useCartStore.getState().loadCart(userId);
});
authEvents.on("logout", () => {
  useCartStore.getState().clearCart();
});