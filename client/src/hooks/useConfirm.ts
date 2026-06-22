import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  variant: "danger" | "warning" | "default";
  confirmLabel: string;
  loading: boolean;
  resolve: ((value: boolean) => void) | null;
}

const INITIAL: ConfirmState = {
  open: false, title: "", message: "", variant: "default",
  confirmLabel: "Confirma", loading: false, resolve: null,
};

/**
 * Hook that replaces window.confirm() with a luxury modal.
 *
 * Usage:
 *   const { confirm, ConfirmModalProps } = useConfirm();
 *   const ok = await confirm({ title: "Stergi?", message: "Esti sigur?", variant: "danger" });
 *   if (ok) doDelete();
 *
 *   // In JSX:
 *   <ConfirmModal {...ConfirmModalProps} />
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(INITIAL);

  const confirm = useCallback(
    (opts: { title: string; message: string; variant?: "danger" | "warning" | "default"; confirmLabel?: string }) =>
      new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: opts.title,
          message: opts.message,
          variant: opts.variant || "default",
          confirmLabel: opts.confirmLabel || "Confirma",
          loading: false,
          resolve,
        });
      }),
    []
  );

  const onConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(INITIAL);
  }, [state.resolve]);

  const onCancel = useCallback(() => {
    state.resolve?.(false);
    setState(INITIAL);
  }, [state.resolve]);

  return {
    confirm,
    confirmModalProps: {
      open: state.open,
      title: state.title,
      message: state.message,
      variant: state.variant,
      confirmLabel: state.confirmLabel,
      loading: state.loading,
      onConfirm,
      onCancel,
    },
  };
}