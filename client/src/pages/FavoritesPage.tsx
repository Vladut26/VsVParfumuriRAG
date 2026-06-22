import { useEffect, useState, type FC } from "react";
import { Link }                from "react-router-dom";
import MainHeader              from "../components/MainHeader";
import MainFooter              from "../components/MainFooter";
import { useFavoriteStore }    from "../stores/favorites";
import { useCartStore }        from "../stores/cart";
import { useToastStore }       from "../stores/toast";
import APIService              from "../services/APIService";
import type { Product }        from "../stores/products";

const FavoritesPage: FC = () => {
  const favorites = useFavoriteStore();
  const cart      = useCartStore();
  const toast     = useToastStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // FIX: single batch request instead of N individual ones
  useEffect(() => {
    const ids = Array.from(favorites.favoriteIds);

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    APIService.getProductsBatch(ids.map(Number))
      .then((res) => setProducts(res.data as Product[]))
      .catch(() => setError("Eroare la încărcarea favoritelor."))
      .finally(() => setLoading(false));

  }, [favorites.favoriteIds, favorites.favoriteIds.size]);  // re-run only when the count changes

  const handleRemove = async (productId: string) => {
    try {
      await favorites.toggle(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.addToast("Eliminat de la favorite.", "info");
    } catch {
      toast.addToast("Eroare la eliminarea din favorite.", "error");
    }
  };

  const handleAddToCart = (product: Product) => {
    const inStock = (product.stock?.quantity ?? 0) > 0;
    if (!inStock) {
      toast.addToast(`${product.name} este epuizat.`, "warning");
      return;
    }
    cart.addItem(product);
    toast.addToast(`${product.name} adăugat în coș!`, "success");
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <MainHeader />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-serif font-bold mb-6">❤️ Produsele Mele Favorite</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <span className="loading loading-dots loading-lg text-primary" />
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6"><span>{error}</span></div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-24 h-24 rounded-full bg-[var(--cream)] flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-[var(--noir)] mb-2">Nicio colectie salvata</h2>
              <p className="text-sm text-gray-400 max-w-sm">Descopera catalogul nostru si apasa pe inima de pe orice produs pentru a-l adauga la favorite.</p>
            </div>
            <Link to="/" className="btn-luxury px-8 py-3 rounded-xl text-sm uppercase tracking-wider mt-2">
              Exploreaza Catalogul
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{products.length} produse salvate</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const inStock = (product.stock?.quantity ?? 0) > 0;
                return (
                  <div key={product.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    <figure className="px-4 pt-4 relative">
                      <Link to={`/product/${product.id}`} className="w-full">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="rounded-xl h-52 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                      {/* Remove from favorites */}
                      <button
                        onClick={() => void handleRemove(product.id)}
                        className="absolute top-6 left-6 btn btn-circle btn-sm bg-red-500 border-red-500 text-white hover:bg-red-600 shadow-md"
                        aria-label="Elimină de la favorite"
                      >
                        ❤️
                      </button>
                      {!inStock && (
                        <span className="absolute top-6 right-6 badge badge-error text-xs">Epuizat</span>
                      )}
                    </figure>

                    <div className="card-body items-center text-center p-4 gap-2">
                      {product.category && (
                        <div className="badge badge-secondary badge-outline text-xs uppercase">
                          {product.category.name}
                        </div>
                      )}
                      <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                        <h2 className="card-title text-base font-serif">{product.name}</h2>
                      </Link>
                      <div className="text-xl font-bold text-primary">{product.price} RON</div>
                      <div className="grid grid-cols-2 gap-2 w-full mt-2">
                        <Link to={`/product/${product.id}`} className="btn btn-outline btn-sm">
                          Detalii
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={!inStock}
                        >
                          {inStock ? "În coș" : "Epuizat"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <MainFooter />
    </div>
  );
};

export default FavoritesPage;