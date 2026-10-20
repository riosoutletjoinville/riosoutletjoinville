// src/lib/utils/sweetAlert.ts
import Swal from "sweetalert2";

/**
 * Confirm dialog estilizado — retorna true se confirmado.
 */
export const confirmAction = async (
  title: string,
  text: string,
  confirmText = "Sim, confirmar",
  options?: {
    icon?: "warning" | "question" | "info" | "error" | "success";
    confirmColor?: string;
  },
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: options?.icon ?? "warning",
    showCancelButton: true,
    confirmButtonColor: options?.confirmColor ?? "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: "rounded-lg",
    },
  });
  return result.isConfirmed;
};

export const toastSuccess = (title: string, text?: string) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    position: "top-end",
    toast: true,
  });

export const toastError = (title: string, text?: string) =>
  Swal.fire({
    icon: "error",
    title,
    text,
    timer: 5000,
    timerProgressBar: true,
    showConfirmButton: false,
    position: "top-end",
    toast: true,
  });

export const alertSuccess = (title: string, text?: string) =>
  Swal.fire({ icon: "success", title, text, confirmButtonColor: "#16a34a" });

export const alertError = (title: string, text?: string) =>
  Swal.fire({ icon: "error", title, text, confirmButtonColor: "#dc2626" });

export const alertInfo = (title: string, text?: string) =>
  Swal.fire({ icon: "info", title, text, confirmButtonColor: "#2563eb" });

export const alertWarning = (title: string, text?: string) =>
  Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#f59e0b" });

/**
 * Mostra loading e executa um callback; retorna resultado ou lança erro.
 */
export const withLoading = async <T>(
  title: string,
  text: string,
  callback: () => Promise<T>,
): Promise<T> => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const result = await callback();
    Swal.close();
    return result;
  } catch (err) {
    Swal.close();
    throw err;
  }
};
