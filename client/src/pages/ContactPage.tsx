import { useState, type FC, type FormEvent } from "react";
import { useToastStore } from "../stores/toast";
import MainHeader from "../components/MainHeader";
import MainFooter from "../components/MainFooter";

const CONTACT_INFO = [
  { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", sub: "M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    title: "Adresa", lines: ["Bucuresti, Romania", "Strada Exemplu Nr. 10"] },
  { icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", sub: "M22,6 L12,13 L2,6",
    title: "Email", lines: ["contact@vsv-parfumuri.ro", "suport@vsv-parfumuri.ro"] },
  { icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z", sub: "",
    title: "Telefon", lines: ["+40 700 000 000", "Luni - Vineri, 9:00 - 18:00"] },
  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", sub: "",
    title: "Program", lines: ["Luni - Vineri: 9:00 - 18:00", "Weekend: 10:00 - 14:00"] },
];

const ContactPage: FC = () => {
  const toast = useToastStore();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.addToast("Mesaj trimis cu succes! Te vom contacta in curand.", "success");
      setForm({ name: "", email: "", subject: "", message: "" });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cream)]">
      <MainHeader />

      {/* Hero */}
      <section className="bg-[var(--noir)] text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--noir)] via-[var(--noir)]/95 to-[var(--gold-dark)]/10" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-12 h-[2px] bg-[var(--gold)] mx-auto mb-5 opacity-60" />
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">Contacteaza-ne</h1>
          <p className="text-white/50 max-w-md mx-auto font-light">
            Suntem aici sa te ajutam. Trimite-ne un mesaj si iti vom raspunde in cel mai scurt timp.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-10 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CONTACT_INFO.map((c) => (
            <div key={c.title} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--cream)] flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.icon} />{c.sub && <path d={c.sub} />}
                </svg>
              </div>
              <h3 className="text-xs font-semibold text-[var(--noir)] uppercase tracking-wider mb-2">{c.title}</h3>
              {c.lines.map((l, i) => (
                <p key={i} className="text-xs text-gray-400">{l}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-bold text-[var(--noir)] mb-1">Trimite un mesaj</h2>
          <p className="text-sm text-gray-400 mb-8">Completeaza formularul si te vom contacta in 24 de ore.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Nume</label>
                <input type="text" required placeholder="Ion Popescu" value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                             focus:border-[var(--gold)] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Email</label>
                <input type="email" required placeholder="email@exemplu.com" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                             focus:border-[var(--gold)] focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Subiect</label>
              <input type="text" required placeholder="Despre ce e vorba?" value={form.subject}
                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                           focus:border-[var(--gold)] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Mesaj</label>
              <textarea required rows={5} placeholder="Scrie mesajul tau aici..." value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm resize-none
                           focus:border-[var(--gold)] focus:outline-none transition-colors" />
            </div>
            <button type="submit" disabled={sending}
              className="btn-luxury px-8 py-3.5 rounded-xl text-sm uppercase tracking-wider font-semibold
                         disabled:opacity-50 flex items-center gap-2">
              {sending ? (
                <span className="w-5 h-5 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
              Trimite Mesajul
            </button>
          </form>
        </div>
      </section>

      <MainFooter />
    </div>
  );
};

export default ContactPage;