/**
 * auth.ts
 *
 * FIX #1 — Circular dependency removed.
 * cart/favorites/orders are NO LONGER imported here.
 * Instead, we emit events via authEvents.ts and each store
 * subscribes independently in its own file.
 *
 * FIX #3 — logout is async; callers must await it (or use void).
 * The store calls the API then clears local state in one atomic step.
 */
import { create } from "zustand";
import APIService  from "../services/APIService";
import { authEvents } from "./authEvents";

interface User {
  id:           string;
  name:         string;
  email:        string;
  role:         string;
  displayName?: string;
  phoneNumber?: string;
  metadata?:    { creationTime?: string };
}

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  isAdmin:         boolean;
  login:    (email: string, password: string) => Promise<boolean>;
  register: (payload: { name: string; email: string; password: string }) => Promise<boolean>;
  logout:   () => Promise<void>;
}

const storedUser  = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

export const useAuthStore = create<AuthState>((set) => ({
  user:            storedUser  ? JSON.parse(storedUser) : null,
  token:           storedToken || null,
  isAuthenticated: !!storedToken,
  isAdmin:         storedUser ? JSON.parse(storedUser)?.role === "admin" : false,

  login: async (email, password) => {
    const response = await APIService.login({ email, password });
    const { token, refreshToken, user } = response.data;

    localStorage.setItem("token",        token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user",         JSON.stringify(user));

    set({ token, user, isAuthenticated: true, isAdmin: user?.role === "admin" });

    // Notify other stores — no import needed
    authEvents.emit("login", user.id);
    return true;
  },

  register: async (payload) => {
    const response = await APIService.register(payload);
    const { token, refreshToken, user } = response.data;

    localStorage.setItem("token",        token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user",         JSON.stringify(user));

    set({ token, user, isAuthenticated: true, isAdmin: user?.role === "admin" });

    authEvents.emit("login", user.id);
    return true;
  },

  logout: async () => {
    // Call API first (best-effort — ignore network errors)
    try { await APIService.logout(); } catch { /* ignore */ }

    // Clear all local state
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    set({ token: null, user: null, isAuthenticated: false, isAdmin: false });

    // Notify other stores
    authEvents.emit("logout");
  },
}));