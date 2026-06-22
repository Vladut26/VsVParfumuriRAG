import type { FC } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MainHeader from "../components/MainHeader";
import MainFooter from "../components/MainFooter";
import { useOrderStore } from "../stores/orders";

const OrderSuccessPage: FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orders   = useOrderStore();
  const order    = orders.orders.find((o) => String(o.id) === id);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <MainHeader />

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center gap-4">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-serif font-bold text-success">Comandă Confirmată!</h1>
            <p className="text-gray-500">
              Mulțumim pentru comandă! Vei primi o confirmare pe email în scurt timp.
            </p>

            {order && (
              <div className="bg-base-200 rounded-xl p-4 w-full text-left text-sm space-y-1 mt-2">
                <p><span className="font-semibold">Nr. Comandă:</span> #{order.id}</p>
                <p><span className="font-semibold">Total:</span> {Number(order.totalAmount).toFixed(2)} RON</p>
                <p><span className="font-semibold">Plată:</span> {order.paymentMethod}</p>
                <p><span className="font-semibold">Livrare la:</span> {order.address}, {order.city}</p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  <span className="badge badge-success badge-sm">{order.status}</span>
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <Link to="/account" className="btn btn-outline flex-1">
                Vezi Comenzile Mele
              </Link>
              <button onClick={() => navigate("/")} className="btn btn-primary text-white flex-1">
                Continuă Cumpărăturile
              </button>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
};

export default OrderSuccessPage;