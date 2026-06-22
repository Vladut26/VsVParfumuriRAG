import { useState, useEffect, useMemo, type FC } from "react";
import { Link }            from "react-router-dom";
import MainHeader          from "../components/MainHeader";
import MainFooter          from "../components/MainFooter";
import AdminSubHeader      from "../components/AdminSubHeader";
import ConfirmModal        from "../components/ConfirmModal";
import { useConfirm }      from "../hooks/useConfirm";
import { useAuthStore }    from "../stores/auth";
import { useToastStore }   from "../stores/toast";
import APIService          from "../services/APIService";

interface Review {
  id: number;
  userId: number;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  sentiment: string;
  sentimentScore: number;
  sentimentSummary: string;
  createdAt: string;
}

interface ProductInfo {
  id: number;
  name: string;
  brand?: string;
  imageUrl?: string;
}

type SortKey = "date" | "rating" | "sentimentScore" | "sentiment";
type SortDir = "asc" | "desc";
type SentimentFilter = "all" | "positive" | "negative" | "mixed" | "pending";

const SENTIMENT_CONFIG: Record<string, { cls: string; icon: string; label: string; barColor: string }> = {
  positive: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: "😊", label: "Pozitiv", barColor: "bg-emerald-400" },
  negative: { cls: "bg-red-50 text-red-600 border-red-100",           icon: "😞", label: "Negativ", barColor: "bg-red-400" },
  mixed:    { cls: "bg-amber-50 text-amber-700 border-amber-100",     icon: "😐", label: "Mixt",    barColor: "bg-amber-400" },
  pending:  { cls: "bg-gray-50 text-gray-400 border-gray-100",        icon: "🔄", label: "Pending", barColor: "bg-gray-300" },
};

const AdminReviewsPage: FC = () => {
  const auth  = useAuthStore();
  const toast = useToastStore();
  const { confirm, confirmModalProps } = useConfirm();

  const [reviews, setReviews]           = useState<Review[]>([]);
  const [products, setProducts]         = useState<Map<number, ProductInfo>>(new Map());
  const [loading, setLoading]           = useState(true);
  const [sortKey, setSortKey]           = useState<SortKey>("date");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [searchQuery, setSearchQuery]   = useState("");

  // ── Load all reviews and products ──────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all products to map IDs to names
        const prodRes = await APIService.getProducts({ size: 500 });
        const prodData = prodRes.data as { content: ProductInfo[] };
        const prodMap = new Map<number, ProductInfo>();
        (prodData.content || []).forEach(p => prodMap.set(p.id, p));
        setProducts(prodMap);

        // Fetch reviews for each product that has reviews
        const allReviews: Review[] = [];
        const reviewPromises = Array.from(prodMap.keys()).map(async (pid) => {
          try {
            const rRes = await APIService.getReviews(String(pid));
            const revs = rRes.data as Review[];
            revs.forEach(r => { r.productId = pid; });
            allReviews.push(...revs);
          } catch { /* some products have no reviews */ }
        });

        await Promise.all(reviewPromises);
        setReviews(allReviews);
      } catch {
        toast.addToast("Eroare la incarcarea recenziilor.", "error");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  // ── Computed stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const analyzed = reviews.filter(r => r.sentiment && r.sentiment !== "pending");
    const pos = analyzed.filter(r => r.sentiment === "positive").length;
    const neg = analyzed.filter(r => r.sentiment === "negative").length;
    const mix = analyzed.filter(r => r.sentiment === "mixed").length;
    const pen = reviews.filter(r => !r.sentiment || r.sentiment === "pending").length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const avgScore = analyzed.length > 0
      ? analyzed.reduce((s, r) => s + (r.sentimentScore || 0), 0) / analyzed.length : 0;

    // Score distribution (1-5)
    const scoreDist = [0, 0, 0, 0, 0];
    analyzed.forEach(r => {
      if (r.sentimentScore >= 1 && r.sentimentScore <= 5)
        scoreDist[r.sentimentScore - 1]++;
    });

    return { pos, neg, mix, pen, total: reviews.length, analyzed: analyzed.length, avgRating, avgScore, scoreDist };
  }, [reviews]);

  // ── Filtered and sorted reviews ────────────────────────────────
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Filter by sentiment
    if (sentimentFilter !== "all") {
      if (sentimentFilter === "pending") {
        result = result.filter(r => !r.sentiment || r.sentiment === "pending");
      } else {
        result = result.filter(r => r.sentiment === sentimentFilter);
      }
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => {
        const prod = products.get(r.productId);
        return r.comment.toLowerCase().includes(q)
          || r.userName.toLowerCase().includes(q)
          || prod?.name.toLowerCase().includes(q)
          || prod?.brand?.toLowerCase().includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":           cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case "rating":         cmp = a.rating - b.rating; break;
        case "sentimentScore": cmp = (a.sentimentScore || 0) - (b.sentimentScore || 0); break;
        case "sentiment": {
          const order: Record<string, number> = { positive: 3, mixed: 2, negative: 1, pending: 0 };
          cmp = (order[a.sentiment] || 0) - (order[b.sentiment] || 0);
          break;
        }
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [reviews, sentimentFilter, searchQuery, sortKey, sortDir, products]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleDelete = async (reviewId: number) => {
    const ok = await confirm({
      title: "Stergere recenzie",
      message: "Esti sigur ca vrei sa stergi aceasta recenzie?",
      variant: "danger",
      confirmLabel: "Sterge",
    });
    if (!ok) return;
    try {
      await APIService.deleteReview(String(reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.addToast("Recenzie stearsa.", "info");
    } catch {
      toast.addToast("Eroare la stergere.", "error");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDir === "desc" ? "↓" : "↑";
  };

  const maxScoreDist = Math.max(...stats.scoreDist, 1);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cream)]">
      <MainHeader />
      {auth.isAdmin && <AdminSubHeader onOpenCreate={() => {}} />}

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-[2px] bg-[var(--gold)]" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--noir)]">Recenzii & Sentiment AI</h1>
            <p className="text-sm text-gray-400 font-light mt-1">Analiza completa a feedback-ului clientilor</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── KPI Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Recenzii", value: String(stats.total), accent: true },
                { label: "Rating Mediu", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) + " ★" : "—" },
                { label: "Scor AI Mediu", value: stats.avgScore > 0 ? stats.avgScore.toFixed(1) + "/5" : "—" },
                { label: "Analizate AI", value: String(stats.analyzed) },
                { label: "In Asteptare", value: String(stats.pen) },
              ].map(({ label, value, accent }) => (
                <div key={label} className={`rounded-2xl p-4 border transition-all ${accent
                  ? "bg-[var(--noir)] text-white border-transparent"
                  : "bg-white border-gray-100"}`}>
                  <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-1 ${accent ? "text-[var(--gold)]" : "text-gray-400"}`}>
                    {label}
                  </p>
                  <p className={`text-xl font-bold ${accent ? "text-white" : "text-[var(--noir)]"}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Charts Row ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Sentiment distribution bar chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-5">
                  Distributia Sentimentului
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Pozitive", count: stats.pos, color: "bg-emerald-400", emoji: "😊" },
                    { label: "Mixte",    count: stats.mix, color: "bg-amber-400",   emoji: "😐" },
                    { label: "Negative", count: stats.neg, color: "bg-red-400",     emoji: "😞" },
                    { label: "Pending",  count: stats.pen, color: "bg-gray-300",    emoji: "🔄" },
                  ].map(({ label, count, color, emoji }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-lg w-8">{emoji}</span>
                      <span className="text-sm text-gray-600 w-20">{label}</span>
                      <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full ${color} rounded-lg transition-all duration-700 flex items-center justify-end pr-2`}
                          style={{ width: stats.total > 0 ? `${Math.max((count / stats.total) * 100, count > 0 ? 8 : 0)}%` : "0%" }}
                        >
                          {count > 0 && (
                            <span className="text-white text-xs font-bold">{count}</span>
                          )}
                        </div>
                        {count === 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300">0</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">
                        {stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Score distribution (1-5) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-5">
                  Distributia Scorului AI (1-5)
                </h3>
                <div className="flex items-end gap-3 h-44">
                  {stats.scoreDist.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-bold text-[var(--noir)]">{count}</span>
                      <div className="w-full rounded-t-lg bg-gray-50 relative" style={{ height: "100%" }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-[var(--gold-dark)] to-[var(--gold)] transition-all duration-700"
                          style={{ height: `${(count / maxScoreDist) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-[var(--gold)] text-sm">{"★".repeat(i + 1)}</span>
                        <p className="text-[10px] text-gray-400">{i + 1}/5</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Filters & Sort ───────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Sentiment filter pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: "all", label: "Toate", count: stats.total },
                    { key: "positive", label: "😊 Pozitive", count: stats.pos },
                    { key: "mixed", label: "😐 Mixte", count: stats.mix },
                    { key: "negative", label: "😞 Negative", count: stats.neg },
                    { key: "pending", label: "🔄 Pending", count: stats.pen },
                  ] as { key: SentimentFilter; label: string; count: number }[]).map(({ key, label, count }) => (
                    <button key={key} onClick={() => setSentimentFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${sentimentFilter === key
                          ? "bg-[var(--noir)] text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                      {label} <span className="opacity-60">({count})</span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <input type="text" placeholder="Cauta dupa produs, user, comentariu..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm
                               focus:border-[var(--gold)] focus:outline-none"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>

              {/* Sort buttons */}
              <div className="flex gap-2 mb-4">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider self-center mr-1">Sorteaza:</span>
                {([
                  { key: "date" as SortKey, label: "Data" },
                  { key: "rating" as SortKey, label: "Rating" },
                  { key: "sentimentScore" as SortKey, label: "Scor AI" },
                  { key: "sentiment" as SortKey, label: "Sentiment" },
                ]).map(({ key, label }) => (
                  <button key={key} onClick={() => handleSort(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                      ${sortKey === key ? "bg-[var(--gold)]/10 text-[var(--gold-dark)] border border-[var(--gold)]/20" : "text-gray-400 hover:text-gray-600"}`}>
                    {label} <span className="text-[10px]">{sortIcon(key)}</span>
                  </button>
                ))}
              </div>

              {/* Reviews list */}
              <div className="space-y-3">
                {filteredReviews.length === 0 && (
                  <p className="text-center text-gray-300 py-8">Nicio recenzie gasita.</p>
                )}

                {filteredReviews.map(review => {
                  const prod = products.get(review.productId);
                  const sentCfg = SENTIMENT_CONFIG[review.sentiment] || SENTIMENT_CONFIG.pending;

                  return (
                    <div key={review.id} className="flex gap-4 p-4 rounded-xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition-all">

                      {/* Product thumbnail */}
                      <Link to={`/product/${review.productId}`} className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                          {prod?.imageUrl ? (
                            <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                          )}
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <Link to={`/product/${review.productId}`}
                              className="text-sm font-semibold text-[var(--noir)] hover:text-[var(--gold-dark)] transition-colors">
                              {prod?.name || `Produs #${review.productId}`}
                            </Link>
                            {prod?.brand && <span className="text-xs text-gray-400 ml-1.5">· {prod.brand}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Stars */}
                            <span className="text-[var(--gold)] text-sm">
                              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                            </span>
                            {/* Sentiment badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${sentCfg.cls}`}>
                              {sentCfg.icon} {sentCfg.label}
                              {review.sentimentScore ? ` (${review.sentimentScore}/5)` : ""}
                            </span>
                          </div>
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 font-light">{review.comment}</p>

                        {/* AI Summary */}
                        {review.sentimentSummary && review.sentiment !== "pending" && (
                          <div className="mt-2 px-3 py-2 bg-[var(--cream)] rounded-lg">
                            <p className="text-[11px] text-gray-400">
                              <span className="mr-1">🤖</span>
                              <span className="font-medium text-gray-500">AI:</span> {review.sentimentSummary}
                            </p>
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] text-gray-300">
                            <span className="font-medium text-gray-400">{review.userName}</span>
                            {" · "}
                            {new Date(review.createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <button onClick={() => void handleDelete(review.id)}
                            className="text-[10px] text-gray-300 hover:text-red-500 transition-colors ml-auto">
                            Sterge
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Count footer */}
              <p className="text-xs text-gray-300 text-center mt-4 pt-4 border-t border-gray-50">
                {filteredReviews.length} din {stats.total} recenzii
              </p>
            </div>

          </div>
        )}
      </main>

      <ConfirmModal {...confirmModalProps} />
      <MainFooter />
    </div>
  );
};

export default AdminReviewsPage;