import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ToastModal          from "./components/ToastModal";
import ProtectedRoute      from "./components/ProtectedRoute";
import ChatBot             from "./components/ChatBot";
import BackToTop           from "./components/BackToTop";
import PageTransition      from "./components/PageTransition";

import HomePage            from "./pages/HomePage";
import ProductDetailsPage  from "./pages/ProductDetailsPage";
import LoginPage           from "./pages/LoginPage";
import RegisterPage        from "./pages/RegisterPage";
import AboutPage           from "./pages/AboutPage";
import ContactPage         from "./pages/ContactPage";
import AccountPage         from "./pages/AccountPage";
import CheckoutPage        from "./pages/CheckoutPage";
import OrderSuccessPage    from "./pages/OrderSuccessPage";
import FavoritesPage       from "./pages/FavoritesPage";
import AdminUsersPage      from "./pages/AdminUsersPage";
import AdminOrdersPage     from "./pages/AdminOrdersPage";
import AdminDashboardPage  from "./pages/AdminDashboardPage";
import AdminReviewsPage   from "./pages/AdminReviewsPage";
import NotFoundPage        from "./pages/NotFoundPage";

/** Hide the chatbot on auth pages */
const ChatBotWrapper = () => {
  const { pathname } = useLocation();
  const hidden = ["/", "/login", "/register"].includes(pathname);
  return hidden ? null : <ChatBot />;
};

/** Animated routes wrapper */
const AnimatedRoutes = () => (
  <PageTransition>
    <Routes>
      {/* Public */}
      <Route path="/"            element={<HomePage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/register"    element={<RegisterPage />} />
      <Route path="/about"       element={<AboutPage />} />
      <Route path="/contact"     element={<ContactPage />} />

      {/* Authenticated */}
      <Route path="/account" element={
        <ProtectedRoute><AccountPage /></ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute><CheckoutPage /></ProtectedRoute>
      } />
      <Route path="/order-success/:id" element={
        <ProtectedRoute><OrderSuccessPage /></ProtectedRoute>
      } />
      <Route path="/favorites" element={
        <ProtectedRoute><FavoritesPage /></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requireAdmin><AdminOrdersPage /></ProtectedRoute>
      } />
      <Route path="/admin/reviews" element={
        <ProtectedRoute requireAdmin><AdminReviewsPage /></ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </PageTransition>
);

export default function App() {
  return (
    <BrowserRouter>
      <ToastModal />
      <AnimatedRoutes />
      <ChatBotWrapper />
      <BackToTop />
    </BrowserRouter>
  );
}