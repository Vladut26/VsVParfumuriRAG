import type { FC } from "react";
import { Link } from "react-router-dom";

interface AdminSubHeaderProps {
  onOpenCreate: () => void;
}

const AdminSubHeader: FC<AdminSubHeaderProps> = ({ onOpenCreate }) => (
  <div className="bg-base-200 border-b border-base-300 py-3 px-4 md:px-8">
    <div className="container mx-auto flex flex-wrap justify-between items-center gap-3">

      <div className="flex items-center gap-2 flex-wrap flex-1 md:flex-none">
        <span className="badge badge-primary badge-outline font-bold hidden md:inline-flex whitespace-nowrap">
          Mod Administrator
        </span>

        <Link to="/admin"
          className="btn btn-sm btn-ghost gap-2 border border-gray-300 md:border-transparent">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Dashboard
        </Link>

        <Link to="/users"
          className="btn btn-sm btn-ghost gap-2 border border-gray-300 md:border-transparent">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Utilizatori
        </Link>

        {/* FIX #5 — direct link to orders dashboard */}
        <Link to="/admin/reviews"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-500 hover:text-[var(--noir)] hover:bg-gray-50 transition-colors">
            <span>🤖</span> Recenzii AI
          </Link>
          <Link to="/admin/orders"
          className="btn btn-sm btn-ghost gap-2 border border-gray-300 md:border-transparent">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Comenzi
        </Link>
      </div>

      <div className="flex-none">
        <button onClick={onOpenCreate}
          className="btn btn-sm btn-primary text-white gap-2 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
          Adaugă Produs
        </button>
      </div>
    </div>
  </div>
);

export default AdminSubHeader;