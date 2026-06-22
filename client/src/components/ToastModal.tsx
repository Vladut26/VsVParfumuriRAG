import { useEffect, type FC } from "react";
import { useToastStore } from "../stores/toast";

const ICONS: Record<string, string> = {
  success: "✓", error: "✕", warning: "⚠", info: "ℹ",
};
const COLORS: Record<string, string> = {
  success: "border-emerald-400 bg-emerald-50 text-emerald-800",
  error:   "border-red-400 bg-red-50 text-red-800",
  warning: "border-amber-400 bg-amber-50 text-amber-800",
  info:    "border-blue-400 bg-blue-50 text-blue-800",
};
const ICON_BG: Record<string, string> = {
  success: "bg-emerald-400", error: "bg-red-400", warning: "bg-amber-400", info: "bg-blue-400",
};

const ToastModal: FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={String(t.id)} message={t.message} type={t.type} onClose={(id)=>removeToast(Number(id))} />
      ))}
    </div>
  );
};

const ToastItem: FC<{ id: string; message: string; type: string; onClose: (id: string) => void }> = ({
  id, message, type, onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
                   backdrop-blur-sm animate-toast-slide-in ${COLORS[type] || COLORS.info}`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0
                         ${ICON_BG[type] || ICON_BG.info}`}>
        {ICONS[type] || ICONS.info}
      </span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => onClose(id)}
        className="text-current opacity-40 hover:opacity-100 transition-opacity text-lg leading-none flex-shrink-0">
        ×
      </button>
    </div>
  );
};

export default ToastModal;