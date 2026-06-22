import { useMemo, useState, type FC } from "react";
import { Link }            from "react-router-dom";
import { useAuthStore }    from "../stores/auth";
import { useCartStore }    from "../stores/cart";
import { useFavoriteStore } from "../stores/favorites";
import { useToastStore }   from "../stores/toast";
import type { Product }    from "../stores/products";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";

interface ProductCardProps {
  product:  Product;
  onEdit:   (product: Product) => void;
  onDelete: (id: string) => void;
}

/**
 * Luxury product card with 2-image hover swap.
 *
 * On hover: the image crossfades to the second image (if available).
 * Falls back to a single image if only one exists.
 */
const ProductCard: FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const { isAdmin, isAuthenticated } = useAuthStore();
  const cart      = useCartStore();
  const favorites = useFavoriteStore();
  const toast     = useToastStore();

  const [hovered, setHovered] = useState(false);
  const isNew = useMemo(() => {
  if (!product.createdAt) return false;
  const nowTimestamp = Date.now(); // isolated instantiation
  return (nowTimestamp - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  }, [product.createdAt]);

  const isFav   = favorites.isFavorite(product.id);
  const inStock = (product.stock?.quantity ?? 0) > 0;

  // Get image list — fall back to single imageUrl
  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const img1 = images[0] || "";
  const img2 = images[1] || images[0] || "";
  const hasSecondImage = images.length >= 2;

  const handleAddToCart = () => {
    cart.addItem(product);
    toast.addToast(`${product.name} adăugat în coș!`, "success");
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.addToast("Trebuie să fii autentificat pentru favorite.", "warning");
      return;
    }
    try { await favorites.toggle(product.id); } catch {
      toast.addToast("Eroare la actualizarea favoritelor.", "error");
    }
  };

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden
                 border border-gray-100 hover:border-[var(--gold)]/20
                 shadow-sm hover:shadow-xl hover:shadow-[var(--gold)]/5
                 transition-all duration-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area — crossfade on hover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--cream)]">
        <Link to={`/product/${product.id}`} className="block w-full h-full relative">
          {/* Primary image */}
          <img
            src={img1 || PLACEHOLDER_IMG}
            alt={product.name}
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out"
            style={{
              opacity:   hovered && hasSecondImage ? 0 : 1,
              transform: hovered ? "scale(1.03)" : "scale(1)",
            }}
          />
          {/* Secondary image — only rendered if exists */}
          {hasSecondImage && (
            <img
              src={img2}
              alt={`${product.name} - alternativă`}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out"
              style={{
                opacity:   hovered ? 1 : 0,
                transform: hovered ? "scale(1)" : "scale(1.03)",
              }}
            />
          )}
        </Link>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Image dots indicator */}
        {hasSecondImage && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${!hovered ? "bg-white" : "bg-white/40"}`} />
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${hovered  ? "bg-white" : "bg-white/40"}`} />
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={() => void handleToggleFavorite()}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center
                      transition-all duration-300 backdrop-blur-sm z-10
                      ${isFav
                        ? "bg-red-500/90 text-white scale-100"
                        : "bg-white/70 text-gray-400 hover:text-red-500 hover:bg-white scale-90 group-hover:scale-100"
                      }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
            fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* New badge */}
        {isNew && inStock && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold
                          uppercase tracking-wider bg-[var(--gold)] text-[var(--noir)] shadow-sm z-10">
            Nou
          </div>
        )}

        {/* Stock badge */}
        {!inStock && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold
                          bg-black/70 text-white uppercase tracking-wider z-10">
            Epuizat
          </div>
        )}
        {inStock && product.stock && product.stock.quantity < 10 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold
                          bg-[var(--gold)] text-[var(--noir)] uppercase tracking-wider z-10">
            Stoc Limitat
          </div>
        )}

        {/* Quick add button on hover */}
        <div className="absolute bottom-3 left-3 right-3
                        opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-300 z-10">
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       bg-white/90 backdrop-blur-sm text-[var(--noir)]
                       hover:bg-[var(--gold)] hover:text-[var(--noir)]"
          >
            {inStock ? "Adaugă în coș" : "Indisponibil"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--gold-dark)] font-medium mb-1.5">
          {product.category?.name || "Parfum"}
          {product.brand && <span className="text-gray-300 mx-1.5">·</span>}
          {product.brand && <span className="text-gray-400">{product.brand}</span>}
        </div>

        <Link to={`/product/${product.id}`}
          className="block font-serif text-base font-semibold text-[var(--noir)]
                     hover:text-[var(--gold-dark)] transition-colors leading-snug mb-2">
          {product.name}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[var(--noir)]">
            {Number(product.price).toFixed(0)}
          </span>
          <span className="text-xs text-gray-400 font-light">RON</span>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => onEdit(product)}
              className="text-[10px] text-gray-500 hover:text-[var(--gold-dark)] uppercase tracking-wider font-medium">
              Editează
            </button>
            <button onClick={() => onDelete(product.id)}
              className="text-[10px] text-gray-500 hover:text-red-500 uppercase tracking-wider font-medium">
              Șterge
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;