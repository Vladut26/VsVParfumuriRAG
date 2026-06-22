import { useState, useRef, type FC, type FormEvent, type ChangeEvent } from "react";
import { useNavigate }     from "react-router-dom";
import { loadStripe }      from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import MainHeader          from "../components/MainHeader";
import MainFooter          from "../components/MainFooter";
import { useCartStore }    from "../stores/cart";
import { useOrderStore }   from "../stores/orders";
import { useAuthStore }    from "../stores/auth";
import { useToastStore }   from "../stores/toast";
import APIService          from "../services/APIService";

type Step = "delivery" | "payment" | "confirm";

// ── Stripe initialization ────────────────────────────────────────────────────
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

// ── Stripe CardElement custom styling ────────────────────────────────────────
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize:        "16px",
      fontFamily:      '"DM Sans", sans-serif',
      color:           "#1A1A1A",
      "::placeholder": { color: "#9CA3AF" },
      iconColor:       "#C9A96E",
    },
    invalid: {
      color:     "#EF4444",
      iconColor: "#EF4444",
    },
  },
  hidePostalCode: true,
};

// ── Inner form component (must be inside <Elements>) ─────────────────────────
const CheckoutForm: FC = () => {
  const navigate = useNavigate();
  const cart     = useCartStore();
  const orders   = useOrderStore();
  const auth     = useAuthStore();
  const toast    = useToastStore();
  const stripe   = useStripe();
  const elements = useElements();

  const [step,        setStep]    = useState<Step>("delivery");
  const [loading,     setLoading] = useState(false);
  const [cardReady,   setCardReady] = useState(false);
  const [paidIntentId, setPaidIntentId] = useState("");
  const isSubmitting = useRef(false);

  const [form, setForm] = useState({
    fullName:      auth.user?.name  || "",
    email:         auth.user?.email || "",
    phone:         "",
    address:       "",
    city:          "",
    postalCode:    "",
    paymentMethod: "card",
  });

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setField(e.target.name, e.target.value);

  const validateDelivery = (): boolean => {
    if (!form.fullName.trim() || !form.phone.trim() ||
        !form.address.trim()  || !form.city.trim()) {
      toast.addToast("Completează toate câmpurile obligatorii.", "error");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.items.length === 0 || isSubmitting.current) return;

    for (const item of cart.items) {
      try { cart.productIdAsNumber(item.productId); } catch (err) {
        toast.addToast("Eroare: " + ((err as Error).message), "error");
        return;
      }
    }

    isSubmitting.current = true;
    setLoading(true);

    try {
      // Payment was already processed in Step 2 (paidIntentId is set)
      const payload = {
        ...form,
        paymentIntentId: paidIntentId,
        items: cart.items.map((i) => ({
          productId:       cart.productIdAsNumber(i.productId),
          productName:     i.productName,
          productBrand:    i.productBrand,
          productImageUrl: i.productImageUrl,
          unitPrice:       i.unitPrice,
          quantity:        i.quantity,
        })),
      };

      const order = await orders.placeOrder(payload);
      if (auth.user?.id) cart.clearCart(auth.user.id);
      navigate("/order-success/" + order.id);

    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      const status   = axiosErr.response?.status;
      const apiMsg   = axiosErr.response?.data?.error;

      if (status === 409) {
        toast.addToast(apiMsg || "Un produs nu mai este disponibil.", "error");
      } else {
        toast.addToast(apiMsg || "Eroare la plasarea comenzii.", "error");
      }
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // Empty cart guard
  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--cream)]">
        <MainHeader />
        <main className="flex-grow flex flex-col items-center justify-center gap-4 p-8">
          <div className="text-6xl">🛒</div>
          <h2 className="text-2xl font-serif font-bold">Coșul tău este gol</h2>
          <p className="text-gray-500">Adaugă produse înainte de a plasa o comandă.</p>
          <button onClick={() => navigate("/")} className="btn-luxury px-6 py-2 rounded-xl text-sm">
            Mergi la Catalog
          </button>
        </main>
        <MainFooter />
      </div>
    );
  }

  const steps: Step[]   = ["delivery", "payment", "confirm"];
  const stepLabels      = ["Livrare", "Plată", "Confirmare"];
  const stepIdx         = steps.indexOf(step);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cream)]">
      <MainHeader />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-serif font-bold mb-6 text-[var(--noir)]">
          Finalizează Comanda
        </h1>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i <= stepIdx
                  ? "bg-[var(--gold)] text-[var(--noir)]"
                  : "bg-gray-200 text-gray-400"
                }`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${i <= stepIdx ? "text-[var(--noir)]" : "text-gray-400"}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <div className={`w-12 h-0.5 ${i < stepIdx ? "bg-[var(--gold)]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <form onSubmit={(e) => void handlePlaceOrder(e)} className="lg:col-span-2 space-y-4">

            {/* Step 1 — Delivery */}
            {step === "delivery" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-serif font-bold mb-4 text-[var(--noir)]">
                  Date de Livrare
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Nume Complet *", name: "fullName",   type: "text",  placeholder: "Ion Popescu" },
                    { label: "Email *",         name: "email",      type: "email", placeholder: "ion@mail.ro" },
                    { label: "Telefon *",        name: "phone",      type: "tel",   placeholder: "07xx xxx xxx" },
                    { label: "Cod Poștal",       name: "postalCode", type: "text",  placeholder: "010001" },
                  ].map(({ label, name, type, placeholder }) => (
                    <div key={name} className="form-control">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        {label}
                      </label>
                      <input type={type} name={name} placeholder={placeholder}
                        className="input input-bordered w-full bg-white focus:border-[var(--gold)] focus:outline-none"
                        value={(form as Record<string, string>)[name]}
                        onChange={handleInput} />
                    </div>
                  ))}
                  <div className="form-control md:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Adresă *
                    </label>
                    <input type="text" name="address" placeholder="Str. Exemplu, Nr. 1"
                      className="input input-bordered w-full bg-white focus:border-[var(--gold)]"
                      value={form.address} onChange={handleInput} />
                  </div>
                  <div className="form-control">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Oraș *
                    </label>
                    <input type="text" name="city" placeholder="București"
                      className="input input-bordered w-full bg-white focus:border-[var(--gold)]"
                      value={form.city} onChange={handleInput} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="button" className="btn-luxury px-6 py-2.5 rounded-xl text-sm"
                    onClick={() => { if (validateDelivery()) setStep("payment"); }}>
                    Continuă → Metodă Plată
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Payment */}
            {step === "payment" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-serif font-bold mb-4 text-[var(--noir)]">
                  Metodă de Plată
                </h2>

                <div className="space-y-3 mb-6">
                  {[
                    { id: "card",     label: "Card Bancar (Stripe)",  icon: "💳", desc: "Visa, Mastercard, AMEX" },
                    { id: "cash",     label: "Ramburs (Cash)",        icon: "💵", desc: "Plătești la livrare" },
                    { id: "transfer", label: "Transfer Bancar",       icon: "🏦", desc: "Plătești prin OP" },
                  ].map((pm) => (
                    <label key={pm.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${form.paymentMethod === pm.id
                          ? "border-[var(--gold)] bg-[var(--gold)]/5"
                          : "border-gray-100 hover:border-[var(--gold)]/30"}`}>
                      <input type="radio" name="paymentMethod" value={pm.id}
                        checked={form.paymentMethod === pm.id}
                        onChange={handleInput}
                        className="radio radio-sm" style={{ accentColor: "var(--gold)" }} />
                      <span className="text-2xl">{pm.icon}</span>
                      <div>
                        <span className="font-semibold text-sm">{pm.label}</span>
                        <p className="text-xs text-gray-400">{pm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Stripe Card Element — shown only when card is selected */}
                {form.paymentMethod === "card" && (
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                      Detalii Card
                    </label>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <CardElement
                        options={CARD_ELEMENT_OPTIONS}
                        onChange={(e) => setCardReady(e.complete)}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      Plată securizată prin Stripe. Datele cardului nu sunt stocate pe serverul nostru.
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      🧪 Test mode — folosește cardul <code className="bg-gray-200 px-1 rounded">4242 4242 4242 4242</code>
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => setStep("delivery")}>
                    ← Înapoi
                  </button>
                  <button type="button" className="btn-luxury px-6 py-2.5 rounded-xl text-sm"
                    disabled={(form.paymentMethod === "card" && !cardReady) || loading}
                    onClick={async () => {
                      if (form.paymentMethod === "card") {
                        if (!stripe || !elements) {
                          toast.addToast("Stripe nu este inițializat.", "error");
                          return;
                        }
                        setLoading(true);
                        try {
                          const intentRes = await APIService.createPaymentIntent({
                            amount: cart.totalPrice(),
                            email: form.email,
                          });
                          const { clientSecret, paymentIntentId: piId } = intentRes.data as {
                            clientSecret: string; paymentIntentId: string;
                          };
                          const cardEl = elements.getElement(CardElement);
                          if (!cardEl) { toast.addToast("Eroare card.", "error"); return; }
                          const result = await stripe.confirmCardPayment(clientSecret, {
                            payment_method: {
                              card: cardEl,
                              billing_details: {
                                name: form.fullName, email: form.email, phone: form.phone,
                                address: { line1: form.address, city: form.city, postal_code: form.postalCode },
                              },
                            },
                          });
                          if (result.error) {
                            toast.addToast(result.error.message || "Plata refuzată.", "error");
                            return;
                          }
                          if (result.paymentIntent?.status !== "succeeded") {
                            toast.addToast("Plata nefinalizată. Status: " + result.paymentIntent?.status, "error");
                            return;
                          }
                          setPaidIntentId(piId);
                          toast.addToast("Plata procesată cu succes! ✅", "success");
                          setStep("confirm");
                        } catch (err: unknown) {
                          toast.addToast("Eroare la plată: " + ((err as Error).message || ""), "error");
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        setStep("confirm");
                      }
                    }}>
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin inline-block mr-2" /> Se procesează...</>
                      : "Continuă → Confirmare"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Confirm */}
            {step === "confirm" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-serif font-bold mb-4 text-[var(--noir)]">
                  Confirmă Comanda
                </h2>

                <div className="bg-[var(--cream)] rounded-xl p-4 space-y-1.5 text-sm mb-4">
                  <p><span className="font-semibold text-gray-600">Nume:</span>   {form.fullName}</p>
                  <p><span className="font-semibold text-gray-600">Email:</span>  {form.email}</p>
                  <p><span className="font-semibold text-gray-600">Telefon:</span> {form.phone}</p>
                  <p><span className="font-semibold text-gray-600">Adresă:</span> {form.address}, {form.city} {form.postalCode}</p>
                  <p><span className="font-semibold text-gray-600">Plată:</span>
                    {form.paymentMethod === "card" ? " 💳 Card Bancar (Stripe)" :
                     form.paymentMethod === "cash" ? " 💵 Ramburs" : " 🏦 Transfer"}
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                      <span className="truncate max-w-[60%] text-gray-700">{item.productName} × {item.quantity}</span>
                      <span className="font-semibold">{(item.unitPrice * item.quantity).toFixed(2)} RON</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span className="text-[var(--gold-dark)]">{cart.totalPrice().toFixed(2)} RON</span>
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <button type="button" className="btn btn-ghost text-sm" onClick={() => setStep("payment")}>
                    ← Înapoi
                  </button>
                  <button type="submit" disabled={loading}
                    className="btn-luxury px-8 py-3 rounded-xl text-sm uppercase tracking-wider">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin inline-block mr-2" /> Se procesează…</>
                      : "✅ Plasează Comanda"}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Order summary sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <h3 className="text-sm font-serif font-bold mb-3 text-[var(--noir)]">Sumar Comandă</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-center">
                  {item.productImageUrl && (
                    <img src={item.productImageUrl} alt={item.productName}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">× {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold whitespace-nowrap">
                    {(item.unitPrice * item.quantity).toFixed(2)} RON
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3">
              <div className="flex justify-between font-bold">
                <span className="text-sm">Total</span>
                <span className="text-[var(--gold-dark)]">{cart.totalPrice().toFixed(2)} RON</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Livrare estimată: 1–3 zile lucrătoare
              </p>
            </div>
          </div>
        </div>
      </main>
      <MainFooter />
    </div>
  );
};

// ── Wrapper with Stripe Elements provider ────────────────────────────────────
const CheckoutPage: FC = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default CheckoutPage;