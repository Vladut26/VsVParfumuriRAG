import { useState, useEffect, type FC } from "react";
import MainHeader  from "../components/MainHeader";
import MainFooter  from "../components/MainFooter";
import APIService  from "../services/APIService";
import { useToastStore } from "../stores/toast";

interface OrderItem {
  productId:       number;
  productName:     string;
  productBrand:    string;
  productImageUrl: string;
  unitPrice:       number;
  quantity:        number;
  lineTotal:       number;
}

interface Order {
  id:            number;
  status:        string;
  fullName:      string;
  email:         string;
  phone:         string;
  address:       string;
  city:          string;
  postalCode:    string;
  paymentMethod: string;
  totalAmount:   number;
  items:         OrderItem[];
  createdAt:     string;
  updatedAt:     string;
}

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

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

const AdminOrdersPage: FC = () => {
  const toast = useToastStore();

  const [orders,          setOrders]          = useState<Order[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedOrder,   setSelectedOrder]   = useState<Order | null>(null);
  const [filterStatus,    setFilterStatus]    = useState<string>("ALL");
  const [filterSearch,    setFilterSearch]    = useState("");
  const [updatingId,      setUpdatingId]      = useState<number | null>(null);

  const loadOrders = () => {
    setLoading(true);
    APIService.getAllOrders()
      .then((res) => setOrders(res.data as Order[]))
      .catch(() => toast.addToast("Eroare la încărcarea comenzilor.", "error"))
      .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await APIService.updateOrderStatus(String(orderId), newStatus);
      setOrders((prev) => prev.map((o) =>
        o.id === orderId ? { ...o, status: (res.data as Order).status } : o
      ));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: (res.data as Order).status } : null);
      }
      toast.addToast("Status actualizat cu succes.", "success");
    } catch {
      toast.addToast("Eroare la actualizarea statusului.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    const q = filterSearch.toLowerCase();
    const matchSearch = !q
      || o.fullName.toLowerCase().includes(q)
      || o.email.toLowerCase().includes(q)
      || String(o.id).includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const countByStatus = (s: string) => orders.filter((o) => o.status === s).length;

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <MainHeader />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-serif font-bold mb-6">📦 Gestionare Comenzi</h1>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="stat bg-base-100 rounded-xl shadow p-3">
            <div className="stat-title text-xs">Total comenzi</div>
            <div className="stat-value text-xl">{orders.length}</div>
          </div>
          {STATUSES.map((s) => (
            <div key={s} className="stat bg-base-100 rounded-xl shadow p-3 cursor-pointer hover:bg-base-200"
              onClick={() => setFilterStatus(s)}>
              <div className="stat-title text-xs">{STATUS_LABEL[s]}</div>
              <div className="stat-value text-xl">{countByStatus(s)}</div>
            </div>
          ))}
          <div className="stat bg-primary text-primary-content rounded-xl shadow p-3">
            <div className="stat-title text-xs text-primary-content/70">Venituri</div>
            <div className="stat-value text-lg">{totalRevenue.toFixed(0)} RON</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="text" placeholder="Caută după nume, email sau #ID..."
            className="input input-bordered input-sm flex-1 min-w-48"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)} />
          <select className="select select-bordered select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">Toate statusurile</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button onClick={loadOrders} className="btn btn-sm btn-outline">
            🔄 Reîncarcă
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>Nicio comandă găsită.</p>
          </div>
        )}

        {/* Orders table */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((order) => (
              <div key={order.id}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="card-body p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">

                    {/* Left: order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm">Comandă #{order.id}</span>
                        <span className={`badge badge-sm ${STATUS_BADGE[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{order.fullName}</p>
                      <p className="text-xs text-gray-400">{order.email} · {order.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {order.address}, {order.city} {order.postalCode}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                        {" · "}{order.paymentMethod}
                      </p>
                    </div>

                    {/* Right: total + actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-primary">
                        {Number(order.totalAmount).toFixed(2)} RON
                      </span>
                      <span className="text-xs text-gray-400">
                        {order.items.length} produs{order.items.length !== 1 ? "e" : ""}
                      </span>

                      {/* Status update */}
                      <select
                        className="select select-bordered select-xs"
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => void handleStatusUpdate(order.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>

                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setSelectedOrder(
                          selectedOrder?.id === order.id ? null : order
                        )}
                      >
                        {selectedOrder?.id === order.id ? "Ascunde" : "Detalii"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded items */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-4 pt-4 border-t border-base-200">
                      <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">
                        Produse comandate
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex gap-3 items-center">
                            {item.productImageUrl && (
                              <img src={item.productImageUrl} alt={item.productName}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-xs text-gray-400">
                                {item.productBrand} · {Number(item.unitPrice).toFixed(2)} RON × {item.quantity}
                              </p>
                            </div>
                            <span className="text-sm font-semibold">
                              {Number(item.lineTotal).toFixed(2)} RON
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3 pt-3 border-t border-base-200">
                        <span className="font-bold text-primary">
                          Total: {Number(order.totalAmount).toFixed(2)} RON
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MainFooter />
    </div>
  );
};

export default AdminOrdersPage;