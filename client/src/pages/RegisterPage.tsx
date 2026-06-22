import { useState, type FC, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";

const RegisterPage: FC = () => {
  const auth = useAuthStore();
  const toast = useToastStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (form.password !== form.confirmPassword) {
      toast.addToast("Parolele nu coincid.", "error");
      return;
    }
    if (form.password.length < 6) {
      toast.addToast("Parola trebuie sa aiba minim 6 caractere.", "error");
      return;
    }
    setLoading(true);
    try {
      await auth.register(form.name, form.email, form.password);
      toast.addToast("Cont creat cu succes! 🎉", "success");
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Eroare la inregistrare.";
      toast.addToast(msg, "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Image panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[var(--noir)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--noir)] via-[var(--noir)]/90 to-[var(--rose)]/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--gold)">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
            </svg>
            <span className="font-serif text-xl font-bold tracking-wider">VsV PARFUMURI</span>
          </Link>
          <div>
            <h2 className="text-4xl font-serif font-bold leading-tight mb-4">
              Intra in<br />
              <span className="text-[var(--gold)]">comunitatea</span><br />
              parfumurilor
            </h2>
            <p className="text-white/50 text-sm max-w-sm leading-relaxed">
              Creeaza un cont pentru a salva parfumurile preferate, a primi 
              recomandari personalizate si a lasa recenzii.
            </p>
          </div>
          <p className="text-white/20 text-xs">© 2026 VsV Parfumuri. Toate drepturile rezervate.</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-[var(--cream)]">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--gold)">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
            </svg>
            <span className="font-serif text-lg font-bold tracking-wider text-[var(--noir)]">VsV PARFUMURI</span>
          </Link>

          <h1 className="text-3xl font-serif font-bold text-[var(--noir)] mb-2">Creeaza un cont</h1>
          <p className="text-gray-400 text-sm mb-8">Gratuit, in mai putin de un minut</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Nume complet</label>
              <input type="text" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                           focus:border-[var(--gold)] focus:outline-none transition-colors"
                placeholder="Ion Popescu"
                value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Email</label>
              <input type="email" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                           focus:border-[var(--gold)] focus:outline-none transition-colors"
                placeholder="email@exemplu.com"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Parola</label>
              <input type="password" required minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                           focus:border-[var(--gold)] focus:outline-none transition-colors"
                placeholder="Minim 6 caractere"
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Confirma parola</label>
              <input type="password" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                           focus:border-[var(--gold)] focus:outline-none transition-colors"
                placeholder="••••••••"
                value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-luxury py-3.5 rounded-xl text-sm uppercase tracking-wider font-semibold
                         disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin" />
              ) : "Creeaza contul"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">sau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Ai deja cont?{" "}
            <Link to="/login" className="text-[var(--gold-dark)] font-semibold hover:underline underline-offset-4">
              Conecteaza-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;