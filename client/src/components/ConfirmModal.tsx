import { type FC, type ReactNode } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANTS = {
  danger:  { icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
             iconColor: "text-red-500", iconBg: "bg-red-50", btnClass: "bg-red-500 hover:bg-red-600 text-white" },
  warning: { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
             iconColor: "text-amber-500", iconBg: "bg-amber-50", btnClass: "bg-amber-500 hover:bg-amber-600 text-white" },
  default: { icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
             iconColor: "text-[var(--gold-dark)]", iconBg: "bg-[var(--cream)]", btnClass: "btn-luxury" },
};

const ConfirmModal: FC<ConfirmModalProps> = ({
  open, title, message, confirmLabel = "Confirma", cancelLabel = "Anuleaza",
  variant = "default", loading = false, onConfirm, onCancel,
}) => {
  if (!open) return null;

  const v = VARIANTS[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-chat-bubble">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${v.iconBg} flex items-center justify-center mx-auto mb-4`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={v.iconColor}>
            <path d={v.icon} />
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-lg font-serif font-bold text-[var(--noir)] text-center mb-2">{title}</h3>
        <div className="text-sm text-gray-500 text-center mb-6 leading-relaxed">{message}</div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200
                       hover:bg-gray-50 transition-colors disabled:opacity-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50
                        flex items-center justify-center gap-2 ${v.btnClass}`}>
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;