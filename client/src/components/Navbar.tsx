import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar: FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="vsv-navbar sticky top-0 z-50">
      <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 min-h-14 gap-3">

        {/* Logo */}
        <div className="navbar-start">
          <Link
            to="/"
            className="text-2xl font-bold tracking-[0.2em] uppercase text-slate-100 hover:text-indigo-400 transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VSV
          </Link>
        </div>

        {/* Search — desktop */}
        <div className="navbar-center hidden md:flex flex-1 max-w-sm mx-4">
          <form onSubmit={handleSearch} className="w-full">
            <label className="input input-sm flex items-center gap-2 bg-white/5 border-white/10 text-slate-300 w-full rounded-full focus-within:border-indigo-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="grow bg-transparent text-sm placeholder:text-slate-500 outline-none"
              />
            </label>
          </form>
        </div>

        {/* Right side */}
        <div className="navbar-end gap-1">
          {/* Mobile search */}
          <div className="dropdown dropdown-end md:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </label>
            <div tabIndex={0} className="dropdown-content bg-[#13131a] border border-white/10 p-3 rounded-2xl shadow-2xl w-72 mt-3">
              <form onSubmit={handleSearch}>
                <label className="input input-sm flex items-center gap-2 bg-white/5 border-white/10 text-slate-300 rounded-full">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="grow bg-transparent text-sm outline-none"
                  />
                  <button type="submit" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">→</button>
                </label>
              </form>
            </div>
          </div>

          {/* Cart */}
          <button className="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-slate-100">
            <div className="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="badge badge-xs badge-primary indicator-item">0</span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;