import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

const stored = localStorage.getItem("vsv_theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initial = stored ? stored === "dark" : prefersDark;

// Apply immediately to prevent flash
if (initial) document.documentElement.classList.add("dark");

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: initial,
  toggle: () =>
    set((s) => {
      const next = !s.isDark;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("vsv_theme", next ? "dark" : "light");
      return { isDark: next };
    }),
}));