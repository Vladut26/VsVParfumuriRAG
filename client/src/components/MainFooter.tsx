import { type FC } from "react";
import { Link } from "react-router-dom";

const MainFooter: FC = () => (
  <footer className="bg-[var(--noir)] text-white/70">
    {/* Gold divider */}
    <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />

    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--gold)">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
            </svg>
            <span className="font-serif text-lg font-bold text-white tracking-wider">VsV PARFUMURI</span>
          </div>
          <p className="text-sm text-white/40 leading-relaxed mb-6">
            Platforma ta de parfumuri si cosmetice cu recomandari personalizate prin inteligenta artificiala.
          </p>
          <div className="flex gap-3">
            {[
              { label: "Instagram", path: "M7.8 2h8.4C19 2 22 5 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8C5 22 2 19 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6" },
              { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
              { label: "TikTok", path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.7 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" },
            ].map((s) => (
              <a key={s.label} href="#" aria-label={s.label}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center
                           hover:border-[var(--gold)]/40 hover:text-[var(--gold)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] font-semibold mb-4">Navigare</h4>
          <ul className="space-y-2.5">
            {[
              { to: "/", label: "Catalog Produse" },
              { to: "/about", label: "Despre Noi" },
              { to: "/contact", label: "Contact" },
              { to: "/favorites", label: "Favorite" },
            ].map(link => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/40 hover:text-[var(--gold)] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] font-semibold mb-4">Categorii</h4>
          <ul className="space-y-2.5">
            {["Eau de Parfum", "Eau de Toilette", "Machiaj", "Ingrijire Ten", "Ingrijire Corp", "Accesorii"].map(cat => (
              <li key={cat}>
                <Link to={`/?category=${encodeURIComponent(cat)}`} className="text-sm text-white/40 hover:text-[var(--gold)] transition-colors">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] font-semibold mb-4">Contact</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 text-[var(--gold)]/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-sm text-white/40">Bucuresti, Romania</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 text-[var(--gold)]/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
              <span className="text-sm text-white/40">contact@vsv-parfumuri.ro</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 text-[var(--gold)]/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="text-sm text-white/40">+40 700 000 000</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-white/20">
          © 2025 VsV Parfumuri. Toate drepturile rezervate.
        </p>
        <p className="text-xs text-white/20">
          Powered by AI · Spring Boot · React · Gemini
        </p>
      </div>
    </div>
  </footer>
);

export default MainFooter;