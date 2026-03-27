import { create } from "zustand";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
  isConfirm: boolean;
  confirmText: string;
  onConfirm: (() => void) | null;

  showAlert: (
    title: string,
    message: string,
    type?: "info" | "error" | "success" | "warning",
  ) => void;
  showConfirm: (
    title: string,
    message: string,
    confirmText: string,
    onConfirm: () => void,
    type?: "warning" | "error",
  ) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: "",
  type: "info",
  isConfirm: false,
  confirmText: "CONFIRM",
  onConfirm: null,

  showAlert: (title, message, type = "info") =>
    set({ visible: true, title, message, type, isConfirm: false }),

  showConfirm: (title, message, confirmText, onConfirm, type = "warning") =>
    set({
      visible: true,
      title,
      message,
      type,
      isConfirm: true,
      confirmText,
      onConfirm,
    }),

  hideAlert: () => set({ visible: false }),
}));
