import { type FC } from "react";
import { Link } from "react-router-dom";
import MainHeader from "../components/MainHeader";
import MainFooter from "../components/MainFooter";

const NotFoundPage: FC = () => (
  <div className="flex flex-col min-h-screen bg-[var(--cream)]">
    <MainHeader />
    <main className="flex-grow flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Large 404 with gold accent */}
        <div className="relative mb-8">
          <span className="text-[140px] md:text-[180px] font-serif font-bold text-gray-100 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[var(--noir)] mb-3">
          Pagina nu a fost gasita
        </h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Se pare ca aceasta pagina nu exista sau a fost mutata.
          Te invitam sa explorezi catalogul nostru de parfumuri.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="btn-luxury px-8 py-3 rounded-xl text-sm uppercase tracking-wider">
            Inapoi Acasa
          </Link>
          <Link to="/"
            className="px-8 py-3 rounded-xl text-sm uppercase tracking-wider border border-[var(--gold)]/20
                       text-[var(--gold-dark)] hover:bg-[var(--gold)]/5 transition-colors">
            Exploreaza Catalogul
          </Link>
        </div>

        {/* Gold divider */}
        <div className="flex items-center gap-3 mt-12">
          <div className="flex-1 h-px bg-[var(--gold)]/10" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" opacity="0.3">
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
          </svg>
          <div className="flex-1 h-px bg-[var(--gold)]/10" />
        </div>
      </div>
    </main>
    <MainFooter />
  </div>
);

export default NotFoundPage;