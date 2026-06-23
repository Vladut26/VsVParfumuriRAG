import { useState, useEffect, useMemo, type FC } from "react";
import { Link }        from "react-router-dom";
import MainHeader      from "../components/MainHeader";
import MainFooter      from "../components/MainFooter";
import APIService      from "../services/APIService";
import { useToastStore } from "../stores/toast";

interface Order {
  id: number; status: string; totalAmount: number;
  paymentMethod: string; createdAt: string;
  items: { productName: string; quantity: number; lineTotal: number }[];
}

interface ReviewSummary {
  productId: number; totalReviews: number;
  averageRating: number; dominantSentiment: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-amber-400",
  CONFIRMED: "bg-blue-400",
  SHIPPED:   "bg-indigo-400",
  DELIVERED: "bg-emerald-400",
  CANCELLED: "bg-red-400",
};

const AdminDashboardPage: FC = () => {
  const toast = useToastStore();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      APIService.getAllOrders(),
      APIService.getReviewSummary?.() ?? Promise.resolve({ data: [] }),
    ])
      .then(([oRes, rRes]) => {
        setOrders(oRes.data as Order[]);
        setReviews(rRes.data as ReviewSummary[]);
      })
      .catch(() => toast.addToast("Eroare la încărcarea datelor.", "error"))
      .finally(() => setLoading(false));
  }, []);

  // ── Computed stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const active     = orders.filter((o) => o.status !== "CANCELLED");
    const revenue    = active.reduce((s, o) => s + Number(o.totalAmount), 0);
    const avgOrder   = active.length > 0 ? revenue / active.length : 0;
    const byStatus: Record<string, number> = {};
    orders.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

    // Revenue by day (last 30 days)
    const dailyRev: Record<string, number> = {};
    active.forEach((o) => {
      const day = o.createdAt?.slice(0, 10) || "unknown";
      dailyRev[day] = (dailyRev[day] || 0) + Number(o.totalAmount);
    });
    const dailySorted = Object.entries(dailyRev)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);

    // Top products by revenue
    const productRev: Record<string, { name: string; revenue: number; qty: number }> = {};
    active.forEach((o) => {
      o.items?.forEach((item) => {
        const key = item.productName;
        if (!productRev[key]) productRev[key] = { name: key, revenue: 0, qty: 0 };
        productRev[key].revenue += Number(item.lineTotal);
        productRev[key].qty     += item.quantity;
      });
    });
    const topProducts = Object.values(productRev)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Sentiment distribution from reviews
    let sentPos = 0, sentMix = 0, sentNeg = 0;
    reviews.forEach((r) => {
      if (r.dominantSentiment === "positive") sentPos += r.totalReviews;
      else if (r.dominantSentiment === "negative") sentNeg += r.totalReviews;
      else sentMix += r.totalReviews;
    });
    const sentTotal = sentPos + sentMix + sentNeg;

    // Payment method distribution
    const paymentMethods: Record<string, number> = {};
    orders.forEach((o) => {
      const m = o.paymentMethod || "unknown";
      paymentMethods[m] = (paymentMethods[m] || 0) + 1;
    });

    return {
      totalOrders: orders.length, revenue, avgOrder,
      byStatus, dailySorted, topProducts,
      sentPos, sentMix, sentNeg, sentTotal,
      paymentMethods,
      totalReviews: reviews.reduce((s, r) => s + r.totalReviews, 0),
      avgRating: reviews.length > 0
        ? reviews.reduce((s, r) => s + r.averageRating * r.totalReviews, 0) /
          reviews.reduce((s, r) => s + r.totalReviews, 0)
        : 0,
    };
  }, [orders, reviews]);

  const maxDailyRev = Math.max(...stats.dailySorted.map(([, v]) => v), 1);
  const maxProductRev = stats.topProducts.length > 0 ? stats.topProducts[0].revenue : 1;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cream)]">
      <MainHeader />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--noir)]">Dashboard Admin</h1>
            <p className="text-sm text-gray-400 font-light mt-1">Statistici și analiză AI</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/orders" className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium
                     hover:border-[var(--gold)]/40 transition-colors">📦 Comenzi</Link>
            <Link to="/admin/reviews" className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium
                     hover:border-[var(--gold)]/40 transition-colors">🤖 Recenzii AI</Link>
            <Link to="/users" className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-medium
                     hover:border-[var(--gold)]/40 transition-colors">👥 Utilizatori</Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── KPI Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Venituri Totale", value: `${stats.revenue.toFixed(0)} RON`, accent: true,
                  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  trend: stats.revenue > 0 ? "+100%" : "" },
                { label: "Comenzi", value: String(stats.totalOrders),
                  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
                  trend: `${stats.byStatus.DELIVERED || 0} livrate` },
                { label: "Valoare Medie", value: `${stats.avgOrder.toFixed(0)} RON`,
                  icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
                  trend: "per comanda" },
                { label: "Recenzii AI", value: String(stats.totalReviews),
                  icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                  trend: stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : "" },
              ].map(({ label, value, accent, icon, trend }) => (
                <div key={label} className={`rounded-2xl p-5 border transition-all hover:shadow-lg ${accent
                  ? "bg-[var(--noir)] text-white border-transparent hover:shadow-[var(--gold)]/10"
                  : "bg-white border-gray-100 hover:border-[var(--gold)]/20"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${accent ? "text-[var(--gold)]" : "text-gray-400"}`}>
                      {label}
                    </p>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-[var(--gold)]/20" : "bg-[var(--cream)]"}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={accent ? "var(--gold)" : "var(--gold-dark)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon} />
                      </svg>
                    </div>
                  </div>
                  <p className={`text-2xl font-bold mb-1 ${accent ? "text-white" : "text-[var(--noir)]"}`}>
                    {value}
                  </p>
                  {trend && (
                    <p className={`text-[10px] font-medium ${accent ? "text-[var(--gold)]/60" : "text-gray-300"}`}>
                      {trend}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* ── Revenue Chart + Order Status ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

             {/* Revenue bar chart */}
<div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
  <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-4">
    Venituri Zilnice (ultimele 14 zile)
  </h3>
  {stats.dailySorted.length === 0 ? (
    <p className="text-sm text-gray-300 py-16 text-center">Nicio comandă înregistrată în ultimele 14 zile.</p>
  ) : (
    <div className="flex items-end justify-start gap-4 h-44 pt-4 pb-6 overflow-x-auto no-scrollbar">
      {stats.dailySorted.map(([day, val]) => (
        <div key={day} className="flex-1 min-w-[40px] flex flex-col items-center h-full justify-end gap-2 group relative">
          
          <div className="absolute -top-4 opacity-0 group-hover:opacity-100 bg-[var(--noir)] text-white text-[9px] px-1.5 py-0.5 rounded shadow transition-opacity font-bold z-10 whitespace-nowrap">
            {val.toFixed(0)} RON
          </div>

          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-[var(--gold-dark)] to-[var(--gold)] transition-all duration-700 shadow-sm group-hover:brightness-110"
            style={{ height: `${Math.max((val / maxDailyRev) * 100, 4)}%` }} // Garantăm un minim de 4% înălțime ca să fie vizibilă dacă suma e infimă
            title={`${day}: ${val.toFixed(0)} RON`}
          />
          
          <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap mt-1 block">
            {day && day !== "unknown" ? day.slice(5) : "Info"}
          </span>
        </div>
      ))}
    </div>
  )}
</div>

              {/* Order status distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-4">
                  Status Comenzi
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status] || "bg-gray-300"}`} />
                      <span className="text-xs text-gray-600 flex-1">{status}</span>
                      <span className="text-sm font-bold text-[var(--noir)]">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Payment methods */}
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mt-6 mb-3">
                  Metode de Plată
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.paymentMethods).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {method === "card" ? "💳 Card" : method === "cash" ? "💵 Ramburs" : "🏦 Transfer"}
                      </span>
                      <span className="font-bold text-[var(--noir)]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Top Products + AI Sentiment ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top products by revenue */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-4">
                  Top Produse (după venituri)
                </h3>
                {stats.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-300 py-4 text-center">Nicio vânzare.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--noir)] truncate">{p.name}</p>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] transition-all duration-500"
                              style={{ width: `${(p.revenue / maxProductRev) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-[var(--noir)]">{p.revenue.toFixed(0)} RON</p>
                          <p className="text-[10px] text-gray-400">{p.qty} buc.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Sentiment analysis */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-4">
                  Analiza AI — Sentimentul Recenziilor
                </h3>

                {stats.sentTotal === 0 ? (
                  <p className="text-sm text-gray-300 py-4 text-center">Nicio recenzie analizată.</p>
                ) : (
                  <>
                    {/* Donut-style display */}
                    <div className="flex items-center justify-center gap-8 py-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-[var(--noir)]">
                          {stats.avgRating.toFixed(1)}
                        </div>
                        <div className="text-[var(--gold)] text-lg mt-1">
                          {"★".repeat(Math.round(stats.avgRating))}{"☆".repeat(5 - Math.round(stats.avgRating))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{stats.totalReviews} recenzii</p>
                      </div>
                    </div>

                    {/* Sentiment bar */}
                    <div className="h-3 rounded-full overflow-hidden bg-gray-100 mb-4">
                      {stats.sentPos > 0 && (
                        <div className="h-full bg-emerald-400 inline-block"
                          style={{ width: `${(stats.sentPos / stats.sentTotal) * 100}%` }} />
                      )}
                      {stats.sentMix > 0 && (
                        <div className="h-full bg-amber-400 inline-block"
                          style={{ width: `${(stats.sentMix / stats.sentTotal) * 100}%` }} />
                      )}
                      {stats.sentNeg > 0 && (
                        <div className="h-full bg-red-400 inline-block"
                          style={{ width: `${(stats.sentNeg / stats.sentTotal) * 100}%` }} />
                      )}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Pozitive", count: stats.sentPos, color: "bg-emerald-400", pct: ((stats.sentPos / stats.sentTotal) * 100).toFixed(0) },
                        { label: "Mixte",    count: stats.sentMix, color: "bg-amber-400",   pct: ((stats.sentMix / stats.sentTotal) * 100).toFixed(0) },
                        { label: "Negative", count: stats.sentNeg, color: "bg-red-400",     pct: ((stats.sentNeg / stats.sentTotal) * 100).toFixed(0) },
                      ].map(({ label, count, color, pct }) => (
                        <div key={label} className="text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                            <span className="text-xs text-gray-500">{label}</span>
                          </div>
                          <p className="text-lg font-bold text-[var(--noir)]">{count}</p>
                          <p className="text-[10px] text-gray-400">{pct}%</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
      <MainFooter />
    </div>
  );
};

export default AdminDashboardPage;