import { useState, type FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore }  from "../stores/auth";
import { useThemeStore } from "../stores/theme";
import { useCartStore }  from "../stores/cart";
import CartDrawer        from "./CartDrawer";

const MainHeader: FC = () => {
  const authStore = useAuthStore();
  const theme     = useThemeStore();
  const cart      = useCartStore();
  const navigate  = useNavigate();

  const [isCartOpen,   setIsCartOpen]   = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await authStore.logout(); } finally { setIsLoggingOut(false); }
    navigate("/login");
  };

  const avatarLetter =
    authStore.user?.displayName?.[0] ??
    authStore.user?.name?.[0] ??
    authStore.user?.email?.[0] ?? "U";

  const displayName =
    authStore.user?.displayName ||
    authStore.user?.name ||
    authStore.user?.email?.split("@")[0];

  const cartCount = cart.totalItems();

  return (
    <>
      <header className="glass-luxury sticky top-0 z-40 border-b border-[var(--gold)]/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-[var(--gold)] text-xl transition-transform group-hover:scale-110">✦</span>
            <span className="font-serif text-lg md:text-xl font-bold text-[var(--noir)] tracking-tight">
              VsV <span className="font-light text-[var(--gold-dark)] hidden sm:inline">Parfumuri</span>
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Dark mode toggle */}
            <button
              onClick={theme.toggle}
              className="w-9 h-9 rounded-full flex items-center justify-center
                         hover:bg-[var(--gold)]/10 transition-all duration-300"
              aria-label="Schimbă tema"
            >
              {theme.isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Cart */}
            <button
              className="relative w-9 h-9 rounded-full flex items-center justify-center
                         hover:bg-[var(--gold)]/10 transition-colors"
              onClick={() => setIsCartOpen(true)}
              aria-label="Coș"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--noir)]" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px]
                                 bg-[var(--gold)] text-[var(--noir)] font-bold flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Favorites */}
            <Link
              to="/favorites"
              className="w-9 h-9 rounded-full flex items-center justify-center
                         hover:bg-[var(--gold)]/10 transition-colors"
              aria-label="Favorite"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--noir)]" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {!authStore.user ? (
              <div className="flex items-center gap-2 ml-1">
                <Link to="/login"
                  className="text-sm text-[var(--noir)] hover:text-[var(--gold-dark)] transition-colors font-medium">
                  Login
                </Link>
                <Link to="/register"
                  className="btn-luxury text-xs px-4 py-2 rounded-lg">
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <span className="hidden lg:inline text-sm text-gray-600 font-light">
                  {displayName}
                </span>
                <div className="dropdown dropdown-end">
                  <label tabIndex={0}
                    className="w-9 h-9 rounded-full bg-[var(--noir)] text-white cursor-pointer
                               flex items-center justify-center text-sm font-semibold uppercase
                               hover:bg-[var(--noir-soft)] transition-colors">
                    {avatarLetter}
                  </label>
                  <ul tabIndex={0}
                    className="mt-3 z-[1] p-2 shadow-xl menu menu-sm dropdown-content rounded-xl w-52
                               bg-white border border-gray-100">
                    <li><Link to="/account" className="font-medium">Contul Meu</Link></li>
                    <li><Link to="/favorites">❤️ Favorite</Link></li>
                    {authStore.isAdmin && <li><Link to="/admin">📊 Dashboard</Link></li>}
                    {authStore.isAdmin && <li><Link to="/users">👥 Utilizatori</Link></li>}
                    {authStore.isAdmin && <li><Link to="/admin/orders">📦 Comenzi</Link></li>}
                    <div className="divider my-1" />
                    <li>
                      <button onClick={() => void handleLogout()} disabled={isLoggingOut}
                        className="text-red-500 font-semibold">
                        {isLoggingOut
                          ? <><span className="loading loading-spinner loading-xs" /> Se deloghează…</>
                          : "Delogare"}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default MainHeader;