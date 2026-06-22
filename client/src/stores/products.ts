import { create } from "zustand";
import APIService from "../services/APIService";

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  stock?: { quantity: number; warehouse?: string };
  category?: { id?: string; name: string; features?: string[] };
}

export interface ProductPage {
  content:       Product[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
}

interface ProductState {
  products:       Product[];
  page:           number;
  totalPages:     number;
  totalElements:  number;
  loading:        boolean;
  error:          string | null;
  searchQuery:    string;
  activeCategory: string;  // "all" or category name

  setSearchQuery:  (q: string) => void;
  setCategory:     (cat: string) => void;
  fetchProducts:   (page?: number, size?: number) => Promise<void>;
  loadNextPage:    () => Promise<void>;
  filteredProducts: () => Product[];

  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const PAGE_SIZE = 12;

export const useProductStore = create<ProductState>((set, get) => ({
  products:       [],
  page:           0,
  totalPages:     0,
  totalElements:  0,
  loading:        false,
  error:          null,
  searchQuery:    "",
  activeCategory: "all",

  filteredProducts: () => get().products,

  setSearchQuery: (q) => {
    set({ searchQuery: q, products: [], page: 0 });
    void get().fetchProducts(0);
  },

  setCategory: (cat) => {
    set({ activeCategory: cat, products: [], page: 0 });
    void get().fetchProducts(0);
  },

  fetchProducts: async (page = 0, size = PAGE_SIZE) => {
    set({ loading: true, error: null });
    try {
      const { searchQuery, activeCategory } = get();
      const res = await APIService.getProducts({
        search:   searchQuery || undefined,
        category: activeCategory === "all" ? undefined : activeCategory,
        page,
        size,
      });
      const data: ProductPage = res.data;
      set((s) => ({
        products:      page === 0 ? data.content : [...s.products, ...data.content],
        page:          data.page,
        totalPages:    data.totalPages,
        totalElements: data.totalElements,
      }));
    } catch {
      set({ error: "Eroare la încărcarea produselor." });
    } finally {
      set({ loading: false });
    }
  },

  loadNextPage: async () => {
    const { page, totalPages, loading } = get();
    if (loading || page + 1 >= totalPages) return;
    await get().fetchProducts(page + 1);
  },

  createProduct: async (data) => {
    const res = await APIService.createProduct(data);
    set((s) => ({
      products:      [res.data, ...s.products],
      totalElements: s.totalElements + 1,
    }));
  },

  updateProduct: async (id, data) => {
    await APIService.updateProduct(id, data);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
  },

  deleteProduct: async (id) => {
    await APIService.deleteProduct(id);
    set((s) => ({
      products:      s.products.filter((p) => p.id !== id),
      totalElements: s.totalElements - 1,
    }));
  },
}));