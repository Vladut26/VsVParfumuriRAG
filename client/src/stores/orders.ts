/**
 * orders.ts
 *
 * FIX #1 — subscribes to authEvents instead of being imported by auth.ts.
 */
import { create }     from "zustand";
import APIService     from "../services/APIService";
import { authEvents } from "./authEvents";

export interface OrderItem {
  productId:       number;
  productName:     string;
  productBrand:    string;
  productImageUrl: string;
  unitPrice:       number;
  quantity:        number;
  lineTotal:       number;
}

export interface Order {
  id:            number;
  status:        string;
  fullName:      string;
  email:         string;
  phone:         string;
  address:       string;
  city:          string;
  postalCode:    string;
  paymentMethod: string;
  totalAmount:   number;
  items:         OrderItem[];
  createdAt:     string;
  updatedAt:     string;
}

interface OrderState {
  orders:      Order[];
  loading:     boolean;
  fetchOrders: () => Promise<void>;
  placeOrder:  (data: unknown) => Promise<Order>;
  clear:       () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders:  [],
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      const res = await APIService.getMyOrders();
      set({ orders: res.data as Order[] });
    } catch {
      set({ orders: [] });
    } finally {
      set({ loading: false });
    }
  },

  placeOrder: async (data) => {
    const res = await APIService.checkout(data);
    const order = res.data as Order;
    set((s) => ({ orders: [order, ...s.orders] }));
    return order;
  },

  clear: () => set({ orders: [] }),
}));

// FIX #1 — subscribe to auth events
authEvents.on("logout", () => { useOrderStore.getState().clear(); });