// src/hooks/useNotification.ts
'use client';

import Swal from 'sweetalert2';

export function useNotification() {
  const showSuccess = (title: string, message?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 3000,
      showConfirmButton: true,
      confirmButtonColor: '#22c55e',
    });
  };

  const showError = (title: string, message?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text: message || 'Ocorreu um erro inesperado',
      confirmButtonColor: '#ef4444',
    });
  };

  const showWarning = (title: string, message?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#f59e0b',
    });
  };

  const showInfo = (title: string, message?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonColor: '#3b82f6',
    });
  };

  const showLoading = (title: string = 'Processando...') => {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const showConfirm = async (title: string, text: string, confirmButtonText: string = 'Confirmar') => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText,
      cancelButtonText: 'Cancelar',
    });

    return result.isConfirmed;
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showConfirm,
  };
}