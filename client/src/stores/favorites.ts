/**
 * favorites.ts
 * - Handles 409 Conflict gracefully (already favorited → sync state)
 * - Fetches favorites on store initialization if token exists
 */
import { create }     from "zustand";
import APIService     from "../services/APIService";
import { authEvents } from "./authEvents";

interface FavoriteState {
  favoriteIds:    Set<string>;
  loading:        boolean;
  fetchFavorites: () => Promise<void>;
  toggle:         (productId: string) => Promise<void>;
  isFavorite:     (productId: string) => boolean;
  clear:          () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: new Set(),
  loading:     false,

  fetchFavorites: async () => {
    set({ loading: true });
    try {
      const res = await APIService.getFavorites();
      const ids = new Set<string>(
        (res.data as Array<{ productId: number }>).map((f) => String(f.productId))
      );
      set({ favoriteIds: ids });
    } catch {
      // Not authenticated or network error — ignore silently
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (productId) => {
    const { favoriteIds } = get();

    if (favoriteIds.has(productId)) {
      // Remove
      try {
        await APIService.removeFavorite(productId);
      } catch {
        // Ignore — may already be removed
      }
      set((s) => {
        const next = new Set(s.favoriteIds);
        next.delete(productId);
        return { favoriteIds: next };
      });
    } else {
      // Add
      try {
        await APIService.addFavorite(productId);
        set((s) => {
          const next = new Set(s.favoriteIds);
          next.add(productId);
          return { favoriteIds: next };
        });
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 409) {
          // Already favorited on the server but not in local state — sync it
          set((s) => {
            const next = new Set(s.favoriteIds);
            next.add(productId);
            return { favoriteIds: next };
          });
        } else {
          throw err; // Re-throw real errors
        }
      }
    }
  },

  isFavorite: (productId) => get().favoriteIds.has(productId),

  clear: () => set({ favoriteIds: new Set() }),
}));

// Subscribe to auth events
authEvents.on("login",  () => { void useFavoriteStore.getState().fetchFavorites(); });
authEvents.on("logout", () => { useFavoriteStore.getState().clear(); });

// Auto-fetch on startup if user is already logged in (page refresh)
if (localStorage.getItem("token")) {
  void useFavoriteStore.getState().fetchFavorites();
}