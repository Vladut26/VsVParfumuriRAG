import { useState, useEffect, type FC, type FormEvent } from "react";
import { useParams, useNavigate, Link }  from "react-router-dom";
import APIService           from "../services/APIService";
import MainHeader           from "../components/MainHeader";
import ConfirmModal          from "../components/ConfirmModal";
import { useConfirm }       from "../hooks/useConfirm";
import MainFooter           from "../components/MainFooter";
import { useAuthStore }     from "../stores/auth";
import { useCartStore }     from "../stores/cart";
import { useFavoriteStore } from "../stores/favorites";
import { useToastStore }    from "../stores/toast";
import type { Product }     from "../stores/products";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";

interface Review {
  id: number; userId: number; userName: string; rating: number;
  comment: string; sentiment: string; sentimentScore: number;
  sentimentSummary: string; createdAt: string;
}
interface ReviewStats { totalReviews: number; averageRating: number; }

// ── Stars ────────────────────────────────────────────────────────────────────
const Stars: FC<{ rating: number; max?: number; size?: string }> = ({
  rating, max = 5, size = "text-base"
}) => (
  <span className={`text-[var(--gold)] ${size}`}>
    {Array.from({ length: max }, (_, i) => (
      <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
    ))}
  </span>
);

// ── Sentiment badge ──────────────────────────────────────────────────────────
const SentimentBadge: FC<{ sentiment: string; score?: number }> = ({ sentiment, score }) => {
  if (!sentiment || sentiment === "pending")
    return <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-400">🔄 Se analizează...</span>;
  const map: Record<string, { cls: string; icon: string; label: string }> = {
    positive: { cls: "bg-emerald-50 text-emerald-700", icon: "😊", label: "Pozitiv" },
    negative: { cls: "bg-red-50 text-red-600",         icon: "😞", label: "Negativ" },
    mixed:    { cls: "bg-amber-50 text-amber-700",     icon: "😐", label: "Mixt" },
  };
  const c = map[sentiment] ?? map.mixed;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.cls}`}>
      {c.icon} AI: {c.label}{score ? ` (${score}/5)` : ""}
    </span>
  );
};

// ── Sentiment distribution bar ────────────────────────────────────────────
const SentimentBar: FC<{ reviews: Review[] }> = ({ reviews }) => {
  const analyzed = reviews.filter((r) => r.sentiment && r.sentiment !== "pending");
  if (analyzed.length === 0) return null;

  const pos  = analyzed.filter((r) => r.sentiment === "positive").length;
  const mix  = analyzed.filter((r) => r.sentiment === "mixed").length;
  const neg  = analyzed.filter((r) => r.sentiment === "negative").length;
  const total = pos + mix + neg;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">
        Analiza AI a Sentimentului
      </p>
      {/* Bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-3">
        {pos > 0 && (
          <div className="bg-emerald-400 transition-all duration-500"
            style={{ width: `${(pos / total) * 100}%` }} />
        )}
        {mix > 0 && (
          <div className="bg-amber-400 transition-all duration-500"
            style={{ width: `${(mix / total) * 100}%` }} />
        )}
        {neg > 0 && (
          <div className="bg-red-400 transition-all duration-500"
            style={{ width: `${(neg / total) * 100}%` }} />
        )}
      </div>
      {/* Labels */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-gray-600">{pos} pozitive</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-gray-600">{mix} mixte</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-gray-600">{neg} negative</span>
        </span>
      </div>
    </div>
  );
};

// ── Image carousel ───────────────────────────────────────────────────────────
const ImageCarousel: FC<{ images: string[]; name: string }> = ({ images, name }) => {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-[var(--cream)] rounded-2xl flex items-center justify-center text-gray-300 text-6xl">
        📷
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Main image */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--cream)] aspect-square">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${name} - imagine ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                         bg-white/80 backdrop-blur-sm flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300
                         hover:bg-white shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                         bg-white/80 backdrop-blur-sm flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300
                         hover:bg-white shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px]
                          bg-black/50 text-white/90 backdrop-blur-sm font-medium">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200
                border-2 ${i === current
                  ? "border-[var(--gold)] shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
                }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const ProductDetailsPage: FC = () => {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const auth      = useAuthStore();
  const cart      = useCartStore();
  const favorites = useFavoriteStore();
  const toast     = useToastStore();

  const [product,  setProduct] = useState<Product | null>(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState<string | null>(null);

  const [reviews,        setReviews]        = useState<Review[]>([]);
  const [stats,          setStats]          = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { confirm, confirmModalProps } = useConfirm();
  const [related, setRelated] = useState<Array<{id:string;name:string;brand?:string;price:number;imageUrl?:string}>>([]);
  const [submitting,     setSubmitting]     = useState(false);
  const [reviewForm,     setReviewForm]     = useState({ rating: 5, comment: "" });
  const [hasReviewed,    setHasReviewed]    = useState(false);

  const loadReviews = () => {
    if (!id) return;
    setReviewsLoading(true);
    Promise.all([APIService.getReviews(id), APIService.getReviewStats(id)])
      .then(([rRes, sRes]) => { setReviews(rRes.data); setStats(sRes.data); })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  };
  
  useEffect(() => {
    if (!id) return;
    APIService.getProductById(id)
      .then((res) => {
        setProduct(res.data);
        // Fetch related products from same category
        const cat = (res.data as { categoryName?: string }).categoryName;
        if (cat) {
          APIService.getProducts({ category: cat, size: 8 }).then((relRes) => {
            const items = ((relRes.data as { content: Array<{id:string;name:string;brand?:string;price:number;imageUrl?:string}> }).content || [])
              .filter((p) => String(p.id) !== id).slice(0, 4);
            setRelated(items);
          }).catch(() => {});
        }
      })
      .catch(() => setError("Produsul nu a putut fi găsit."))
      .finally(() => setLoading(false));
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (auth.user && reviews.length > 0)
      setHasReviewed(reviews.some((r) => String(r.userId) === auth.user!.id));
  }, [reviews, auth.user]);

  

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      const res = await APIService.createReview(id, reviewForm);
      setReviews((prev) => [res.data, ...prev]);
      setHasReviewed(true);
      setReviewForm({ rating: 5, comment: "" });
      toast.addToast("Recenzie trimisă! Analiza AI este în curs... 🤖", "success");
      setTimeout(loadReviews, 10000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
        || "Eroare la trimiterea recenziei.";
      toast.addToast(msg, "error");
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (reviewId: number) => {
    const ok = await confirm({ title: "Stergere recenzie", message: "Esti sigur ca vrei sa stergi aceasta recenzie?", variant: "danger", confirmLabel: "Sterge recenzia" });
    if (!ok) return;
    try {
      await APIService.deleteReview(String(reviewId));
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.addToast("Recenzie ștearsă.", "info");
    } catch { toast.addToast("Eroare la ștergerea recenziei.", "error"); }
  };

  const inStock = (product?.stock?.quantity ?? 0) > 0;
  const isFav   = product ? favorites.isFavorite(product.id) : false;
  const images  = product?.imageUrls?.length ? product.imageUrls
                : product?.imageUrl ? [product.imageUrl] : [];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cream)]">
      <MainHeader />
      <main className="flex-grow container mx-auto p-4 md:p-10 max-w-6xl">

        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--gold-dark)] transition-colors mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Înapoi la produse
        </button>

        {loading && (
          <div className="flex justify-center h-64 items-center">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        {product && (
          <>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
              <Link to="/" className="hover:text-[var(--gold-dark)] transition-colors">Acasa</Link>
              <span className="text-gray-300">›</span>
              {product.category?.name && (
                <>
                  <span className="hover:text-[var(--gold-dark)] transition-colors">{product.category?.name}</span>
                  <span className="text-gray-300">›</span>
                </>
              )}
              <span className="text-[var(--noir)] font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>

            {/* ── Product section ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">

              {/* Left — Image carousel */}
              <ImageCarousel images={images} name={product.name} />

              {/* Right — Info */}
              <div className="flex flex-col">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold-dark)] font-semibold
                                   border border-[var(--gold)]/20 px-2.5 py-1 rounded-full">
                    {product.category?.name || "Parfum"}
                  </span>
                  {product.brand && (
                    <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 px-2.5 py-1">
                      {product.brand}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--noir)] mb-3 leading-tight">
                  {product.name}
                </h1>

                {stats && stats.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Stars rating={stats.averageRating} />
                    <span className="text-sm text-gray-400 font-light">
                      {stats.averageRating.toFixed(1)} ({stats.totalReviews} recenzii)
                    </span>
                  </div>
                )}

                <p className="text-gray-500 leading-relaxed mb-6 font-light">{product.description}</p>

                <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-gray-100">
                  <span className="text-4xl font-bold text-[var(--noir)]">{Number(product.price).toFixed(0)}</span>
                  <span className="text-sm text-gray-400 font-light">RON</span>
                  {inStock ? (
                    <span className="ml-auto text-xs text-emerald-600 font-medium">
                      ✓ În stoc ({product.stock?.quantity} buc.)
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-red-500 font-medium">✕ Epuizat</span>
                  )}
                </div>

                {product.category?.features && product.category.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">
                      Caracteristici
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.category.features.map((feat, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium
                                                  border border-[var(--gold)]/20 text-[var(--gold-dark)]">
                          ✨ {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => {
                      if (!auth.isAuthenticated) { toast.addToast("Autentifică-te pentru favorite.", "warning"); return; }
                      void favorites.toggle(product.id);
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center
                      transition-all duration-200
                      ${isFav ? "border-red-400 bg-red-50 text-red-500" : "border-gray-200 text-gray-400 hover:border-[var(--gold)]/40"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24"
                      fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { cart.addItem(product); toast.addToast(`${product.name} adăugat!`, "success"); }}
                    disabled={!inStock}
                    className="flex-1 btn-luxury py-3 rounded-xl text-sm uppercase tracking-wider
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {inStock ? "Adaugă în coș" : "Stoc epuizat"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Reviews section ─────────────────────────────────────── */}
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-bold text-[var(--noir)]">
                Recenzii
                {stats && stats.totalReviews > 0 && (
                  <span className="text-base font-light text-gray-400 ml-2">({stats.totalReviews})</span>
                )}
              </h2>

              {/* Submit form */}
              {auth.isAuthenticated && !hasReviewed && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-serif font-bold text-lg mb-3">Lasă o recenzie</h3>
                  <form onSubmit={(e) => void handleSubmitReview(e)} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <button key={star} type="button"
                            onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                            className={`text-2xl transition-transform hover:scale-110
                              ${star <= reviewForm.rating ? "text-[var(--gold)]" : "text-gray-200"}`}>
                            ★
                          </button>
                        ))}
                        <span className="ml-2 self-center text-xs text-gray-400">{reviewForm.rating}/5</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                        Comentariu
                      </label>
                      <textarea className="w-full h-28 resize-none rounded-xl border border-gray-200 p-3 text-sm
                                           focus:border-[var(--gold)]/40 focus:outline-none font-light"
                        placeholder="Experiența ta cu acest produs..."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        minLength={10} maxLength={2000} required />
                      <p className="text-[10px] text-gray-300 mt-1">{reviewForm.comment.length}/2000</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={submitting}
                        className="btn-luxury px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider">
                        {submitting ? "Se trimite..." : "Trimite Recenzia"}
                      </button>
                      <span className="text-[10px] text-gray-300">🤖 Analiza AI se face automat</span>
                    </div>
                  </form>
                </div>
              )}

              {!auth.isAuthenticated && (
                <p className="text-sm text-gray-400 bg-white rounded-xl p-4 border border-gray-100">
                  Autentifică-te pentru a lăsa o recenzie.
                </p>
              )}
              {hasReviewed && (
                <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl p-4">
                  ✅ Ai lăsat deja o recenzie pentru acest produs.
                </p>
              )}

              {reviewsLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Sentiment distribution bar */}
              <SentimentBar reviews={reviews} />

              {!reviewsLoading && reviews.length === 0 && (
                <div className="text-center py-12 text-gray-300">
                  <div className="text-4xl mb-2 opacity-30">💬</div>
                  <p className="text-sm">Nicio recenzie încă. Fii primul!</p>
                </div>
              )}

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--noir)] text-white
                                        flex items-center justify-center text-sm font-semibold uppercase">
                          {review.userName?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[var(--noir)]">{review.userName}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("ro-RO",
                              { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Stars rating={review.rating} size="text-sm" />
                        <SentimentBadge sentiment={review.sentiment} score={review.sentimentScore} />
                        {auth.isAdmin && (
                          <button onClick={() => void handleDeleteReview(review.id)}
                            className="text-[10px] text-gray-300 hover:text-red-500 transition-colors">✕</button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed font-light">{review.comment}</p>
                    {review.sentimentSummary && review.sentiment !== "pending" && (
                      <div className="mt-3 p-3 bg-[var(--cream)] rounded-lg">
                        <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
                          <span>🤖</span>
                          <span><span className="font-medium text-gray-500">Rezumat AI:</span> {review.sentimentSummary}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Related Products ──────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-16 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-[var(--gold)]" />
              <h3 className="text-xl font-serif font-bold text-[var(--noir)]">S-ar putea sa-ti placa</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden
                             hover:border-[var(--gold)]/20 hover:shadow-lg hover:shadow-[var(--gold)]/5 transition-all">
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img src={p.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"; }} />
                  </div>
                  <div className="p-3">
                    {p.brand && <p className="text-[10px] text-[var(--gold-dark)] uppercase tracking-wider mb-0.5">{p.brand}</p>}
                    <p className="text-sm font-medium text-[var(--noir)] truncate">{p.name}</p>
                    <p className="text-base font-bold text-[var(--gold-dark)] mt-1">{Number(p.price).toFixed(0)} RON</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <ConfirmModal {...confirmModalProps} />
      <MainFooter />
    </div>
  );
};

export default ProductDetailsPage;