import { type FC } from "react";

interface CategoryBarProps {
  active:   string;
  onChange: (category: string) => void;
}

const CATEGORIES = [
  { id: "all",              label: "Toate",           icon: "✦" },
  { id: "Eau de Parfum",    label: "Eau de Parfum",   icon: "🌸" },
  { id: "Eau de Toilette",  label: "Eau de Toilette", icon: "🌿" },
  { id: "Parfum",           label: "Parfum",          icon: "✨" },
  { id: "Machiaj",          label: "Machiaj",         icon: "💄" },
  { id: "Îngrijire Ten",    label: "Îngrijire Ten",   icon: "🧴" },
  { id: "Îngrijire Păr",    label: "Îngrijire Păr",   icon: "💇" },
  { id: "Îngrijire Corp",   label: "Îngrijire Corp",  icon: "🛁" },
  { id: "Accesorii",        label: "Accesorii",       icon: "👜" },
];

const CategoryBar: FC<CategoryBarProps> = ({ active, onChange }) => (
  <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-16 z-30">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap
              text-xs font-medium tracking-wide transition-all duration-200 flex-shrink-0
              ${active === cat.id
                ? "bg-[var(--noir)] text-white shadow-sm"
                : "text-gray-500 hover:text-[var(--noir)] hover:bg-gray-50"
              }
            `}
          >
            <span className="text-sm">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export { CATEGORIES };
export default CategoryBar;