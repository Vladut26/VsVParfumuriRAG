import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/main.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// Register store event subscriptions before any component renders (Fix #1 circular deps)
import "./stores/theme";
import "./stores/cart";
import "./stores/favorites";
import "./stores/orders";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);