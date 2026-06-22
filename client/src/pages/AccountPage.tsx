import { useState, useEffect, useMemo, type FC, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore }     from "../stores/auth";
import { useOrderStore }    from "../stores/orders";
import { useFavoriteStore } from "../stores/favorites";
import { useToastStore }    from "../stores/toast";
import APIService           from "../services/APIService";
import MainHeader           from "../components/MainHeader";
import { useConfirm }      from "../hooks/useConfirm";
import ConfirmModal from "../components/ConfirmModal";
import MainFooter           from "../components/MainFooter";

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "badge-warning",
  CONFIRMED: "badge-info",
  SHIPPED:   "badge-primary",
  DELIVERED: "badge-success",
  CANCELLED: "badge-error",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "În așteptare",
  CONFIRMED: "Confirmat",
  SHIPPED:   "Expediat",
  DELIVERED: "Livrat",
  CANCELLED: "Anulat",
};

const AccountPage: FC = () => {
  const authStore     = useAuthStore();
  const orderStore    = useOrderStore();
  const favoriteStore = useFavoriteStore();
  const toast         = useToastStore();
  const navigate      = useNavigate();

  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);
  const { confirm, confirmModalProps } = useConfirm();
  const [activeTab, setActiveTab]         = useState<"orders" | "profile" | "favorites">("orders");

  const [formData, setFormData] = useState({
    name:        authStore.user?.name        || "",
    email:       authStore.user?.email       || "",
    phoneNumber: authStore.user?.phoneNumber || "",
    address:     "",
  });

  useEffect(() => {
    void orderStore.fetchOrders();
    void favoriteStore.fetchFavorites();
    // Fetch full profile to get address and phone
    APIService.getMyProfile()
      .then((res) => {
        const u = res.data as {
          name?: string; email?: string;
          phoneNumber?: string; address?: string;
        };
        setFormData({
          name:        u.name        || "",
          email:       u.email       || "",
          phoneNumber: u.phoneNumber || "",
          address:     u.address     || "",
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinDate = useMemo(() => {
    const ct = (authStore.user as { metadata?: { creationTime?: string } })
      ?.metadata?.creationTime;
    if (ct) return new Date(ct).toLocaleDateString("ro-RO",
      { month: "long", year: "numeric" });
    return "Recent";
  }, [authStore.user]);

  // FIX #1 — profile update wired to PUT /api/users/me
  const updateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await APIService.updateMyProfile({
        name:        formData.name,
        phoneNumber: formData.phoneNumber,
        address:     formData.address,
      });
      // Update auth store name so header reflects change immediately
      const updated = res.data as { name?: string; email?: string; role?: string };
      const currentUser = authStore.user;
      if (currentUser) {
        const merged = { ...currentUser, name: updated.name || currentUser.name };
        localStorage.setItem("user", JSON.stringify(merged));
      }
      toast.addToast("Profil actualizat cu succes! ✅", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error || "Eroare la salvarea profilului.";
      toast.addToast(msg, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirm({ title: "Delogare", message: "Esti sigur ca vrei sa te deloghezi?", variant: "warning", confirmLabel: "Delogheaza-ma" });
    if (!ok) return;
    setLoggingOut(true);
    try {
      await authStore.logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const ok = await confirm({ title: "Anulare comanda", message: "Esti sigur ca vrei sa anulezi comanda #" + orderId + "? Stocul va fi restabilit.", variant: "danger", confirmLabel: "Anuleaza comanda" });
    if (!ok) return;
    try {
      await APIService.cancelOrder(String(orderId));
      toast.addToast("Comanda #" + orderId + " a fost anulată.", "info");
      void orderStore.fetchOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        .response?.data?.error || "Eroare la anularea comenzii.";
      toast.addToast(msg, "error");
    }
  };

  const setField = (key: string, value: string) =>
    setFormData((f) => ({ ...f, [key]: value }));

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-[var(--cream)] py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-[var(--gold)]" />
            <h1 className="text-3xl font-serif font-bold text-[var(--noir)]">Contul Meu</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <div className="w-full lg:w-1/3 space-y-6">

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 items-center text-center">
                  <div className="avatar placeholder mb-4">
                    <div className="bg-neutral text-neutral-content rounded-full w-24">
                      <span className="text-3xl">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                  </div>
                  <h2 className="card-title">{formData.name || "Utilizator"}</h2>
                  <p className="text-gray-500 text-sm">{formData.email}</p>
                  <div className="badge badge-primary badge-outline mt-2 capitalize">
                    Membru din {joinDate}
                  </div>
                  <div className="card-actions w-full mt-6">
                    <button
                      onClick={() => void handleLogout()}
                      disabled={loggingOut}
                      className="btn btn-outline btn-error btn-sm w-full"
                    >
                      {loggingOut
                        ? <><span className="loading loading-spinner loading-xs" /> Se deloghează…</>
                        : "Delogare"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="stats stats-vertical shadow w-full bg-base-100">
                <div className="stat cursor-pointer hover:bg-base-200 transition-colors"
                  onClick={() => setActiveTab("orders")}>
                  <div className="stat-figure text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      className="inline-block w-8 h-8 stroke-current">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="stat-title">Comenzi</div>
                  <div className="stat-value text-primary">{orderStore.orders.length}</div>
                  <div className="stat-desc">Vezi istoricul →</div>
                </div>

                <div className="stat cursor-pointer hover:bg-base-200 transition-colors"
                  onClick={() => setActiveTab("favorites")}>
                  <div className="stat-figure text-error">
                    <span className="text-3xl">❤️</span>
                  </div>
                  <div className="stat-title">Favorite</div>
                  <div className="stat-value text-error">{favoriteStore.favoriteIds.size}</div>
                  <div className="stat-desc">
                    <Link to="/favorites" className="link link-error">Gestionează →</Link>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="p-6 p-3">
                  <div className="flex flex-col gap-1">
                    {(["orders", "profile", "favorites"] as const).map((tab) => (
                      <button key={tab}
                        className={`btn btn-sm justify-start ${activeTab === tab ? "btn-primary text-white" : "btn-ghost"}`}
                        onClick={() => setActiveTab(tab)}>
                        {tab === "orders"    && "📦 Comenzile Mele"}
                        {tab === "profile"   && "👤 Date Personale"}
                        {tab === "favorites" && "❤️ Favorite"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="w-full lg:w-2/3 space-y-6">

              {/* Orders */}
              {activeTab === "orders" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <h3 className="card-title mb-4">Istoric Comenzi</h3>

                    {orderStore.loading && (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner text-primary" />
                      </div>
                    )}

                    {!orderStore.loading && orderStore.orders.length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        <div className="text-5xl mb-3">📦</div>
                        <p>Nu ai plasat nicio comandă încă.</p>
                        <Link to="/" className="btn-luxury px-5 py-2.5 rounded-xl text-sm uppercase tracking-wider text-white btn-sm mt-3">
                          Explorează Produsele
                        </Link>
                      </div>
                    )}

                    <div className="space-y-4">
                      {orderStore.orders.map((order) => (
                        <div key={order.id} className="border border-base-200 rounded-xl p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                            <div>
                              <p className="font-semibold text-sm">Comandă #{order.id}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                                  day: "numeric", month: "long", year: "numeric",
                                })}
                              </p>
                            </div>
                            <span className={`badge ${STATUS_BADGE[order.status] ?? "badge-ghost"}`}>
                              {STATUS_LABEL[order.status] ?? order.status}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex gap-3 items-center">
                                {item.productImageUrl && (
                                  <img src={item.productImageUrl} alt={item.productName}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{item.productName}</p>
                                  <p className="text-xs text-gray-400">× {item.quantity}</p>
                                </div>
                                <p className="text-xs font-semibold whitespace-nowrap">
                                  {Number(item.lineTotal).toFixed(2)} RON
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-base-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{order.paymentMethod}</span>
                              {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                                <button
                                  onClick={() => void handleCancelOrder(order.id)}
                                  className="text-[10px] text-red-400 hover:text-red-600 font-medium
                                             uppercase tracking-wider transition-colors"
                                >
                                  Anulează
                                </button>
                              )}
                            </div>
                            <span className="font-bold text-primary">
                              {Number(order.totalAmount).toFixed(2)} RON
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile — FIX #1: wired to backend */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <h3 className="card-title mb-4">Date Personale</h3>
                    <form onSubmit={(e) => void updateProfile(e)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Nume Complet *</span>
                        </label>
                        <input type="text" className="input input-bordered"
                          value={formData.name} required minLength={3}
                          onChange={(e) => setField("name", e.target.value)} />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Email</span>
                          <span className="label-text-alt text-gray-400">Nu se poate modifica</span>
                        </label>
                        <input type="email" className="input input-bordered input-disabled"
                          value={formData.email} disabled />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Telefon</span>
                        </label>
                        <input type="text" placeholder="07xx xxx xxx"
                          className="input input-bordered"
                          value={formData.phoneNumber}
                          onChange={(e) => setField("phoneNumber", e.target.value)} />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text font-semibold">Adresă Livrare</span>
                        </label>
                        <input type="text" placeholder="Str. Exemplu, Nr. 1, București"
                          className="input input-bordered"
                          value={formData.address}
                          onChange={(e) => setField("address", e.target.value)} />
                      </div>

                      <div className="form-control md:col-span-2 mt-2">
                        <button type="submit" className="btn-luxury px-5 py-2.5 rounded-xl text-sm uppercase tracking-wider"
                          disabled={savingProfile}>
                          {savingProfile
                            ? <><span className="loading loading-spinner loading-xs" /> Se salvează…</>
                            : "Salvează Modificările"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Favorites shortcut */}
              {activeTab === "favorites" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 items-center text-center py-12">
                    <span className="text-5xl">❤️</span>
                    <h3 className="text-xl font-serif font-bold mt-3">
                      {favoriteStore.favoriteIds.size} produse la favorite
                    </h3>
                    <Link to="/favorites" className="btn-luxury px-5 py-2.5 rounded-xl text-sm uppercase tracking-wider text-white mt-4">
                      Vezi Toate Favoritele →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <MainFooter />
      <ConfirmModal {...confirmModalProps} />
    </>
  );
};

export default AccountPage;