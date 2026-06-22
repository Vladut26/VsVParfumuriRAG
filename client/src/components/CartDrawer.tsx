import { useState, type FC } from "react";
import { useNavigate }      from "react-router-dom";
import { useCartStore }     from "../stores/cart";
import { useAuthStore }     from "../stores/auth";
import { useToastStore }    from "../stores/toast";
import APIService           from "../services/APIService";
import type { Product }     from "../stores/products";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";

interface CartDrawerProps {
  isOpen:  boolean;
  onClose: () => void;
}

const CartDrawer: FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const cart     = useCartStore();
  const auth     = useAuthStore();
  const toast    = useToastStore();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const goCheckout = async () => {
    if (!auth.isAuthenticated) {
      onClose();
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }
    if (cart.items.length === 0) return;
    setChecking(true);
    try {
      const ids = cart.items.map((i) => Number(i.productId));
      const res = await APIService.getProductsBatch(ids);
      const products = res.data as Product[];
      const bad: string[] = [];
      for (const item of cart.items) {
        const live = products.find((p) => String(p.id) === item.productId);
        const avail = live?.stock?.quantity ?? 0;
        if (avail <= 0) bad.push(`${item.productName} (epuizat)`);
        else if (avail < item.quantity) bad.push(`${item.productName} (disponibil: ${avail})`);
      }
      if (bad.length > 0) {
        bad.forEach((m) => toast.addToast(`⚠ ${m}`, "error", 6000));
        setChecking(false);
        return;
      }
      onClose();
      navigate("/checkout");
    } catch {
      onClose();
      navigate("/checkout");
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />}

      <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col
                        transition-transform duration-300 ease-out
                        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "linear-gradient(180deg, #faf8f5 0%, #fff 100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--gold)]/10">
          <div>
            <h2 className="font-serif font-bold text-[var(--noir)]">Coșul Meu</h2>
            {cart.totalItems() > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">{cart.totalItems()} articole</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center
                     text-gray-400 hover:text-[var(--noir)] hover:bg-gray-100 transition-colors text-sm">✕</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1" className="opacity-20">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-serif text-sm">Coșul tău este gol</p>
              <button onClick={onClose}
                className="btn-luxury px-5 py-2 rounded-lg text-xs uppercase tracking-wider">
                Explorează
              </button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-white rounded-xl p-3 border border-gray-100">
                <img
                  src={item.productImageUrl || PLACEHOLDER_IMG}
                  alt={item.productName}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-[var(--noir)]">{item.productName}</p>
                  {item.productBrand && <p className="text-[10px] text-gray-400">{item.productBrand}</p>}
                  <p className="text-[var(--gold-dark)] font-bold text-sm mt-1">
                    {item.unitPrice.toFixed(2)} RON
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center
                                       text-xs hover:border-[var(--gold)] transition-colors"
                      onClick={() => cart.updateQty(item.productId, item.quantity - 1)}>−</button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center
                                       text-xs hover:border-[var(--gold)] transition-colors"
                      onClick={() => cart.updateQty(item.productId, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button className="text-gray-300 hover:text-red-400 text-xs transition-colors"
                    onClick={() => cart.removeItem(item.productId)}>✕</button>
                  <p className="text-xs font-semibold text-[var(--noir)]">
                    {(item.unitPrice * item.quantity).toFixed(2)} RON
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="px-5 py-4 border-t border-[var(--gold)]/10 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold text-[var(--noir)]">{cart.totalPrice().toFixed(2)} RON</span>
            </div>
            <button onClick={() => void goCheckout()} disabled={checking}
              className="w-full btn-luxury py-3 rounded-xl text-sm uppercase tracking-wider">
              {checking
                ? <span className="w-5 h-5 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin inline-block" />
                : "Finalizează Comanda"}
            </button>
            <button onClick={onClose}
              className="w-full text-center text-xs text-gray-400 hover:text-[var(--gold-dark)] transition-colors py-1">
              Continuă cumpărăturile
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;