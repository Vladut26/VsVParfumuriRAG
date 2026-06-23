import { create } from "zustand";

interface RecProduct {
  id: number;
  name: string;
  brand?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  inStock: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: RecProduct[];
}

interface ChatStore {
  messages: ChatMessage[];
  loading: boolean;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  loading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set({ loading }),
  clearMessages: () => set({ messages: [] }),
}));