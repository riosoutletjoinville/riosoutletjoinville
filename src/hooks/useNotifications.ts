// hooks/useNotifications.ts
import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';

export const useNotification = () => {
  const showSuccess = useCallback((title: string, message?: string) => {
    Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonColor: '#3085d6',
      timer: 3000,
      timerProgressBar: true,
    });
  }, []);

  const showError = useCallback((title: string, message?: string) => {
    Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#3085d6',
    });
  }, []);

  const showWarning = useCallback((title: string, message?: string) => {
    Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#3085d6',
    });
  }, []);

  const showInfo = useCallback((title: string, message?: string) => {
    Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonColor: '#3085d6',
      timer: 3000,
      timerProgressBar: true,
    });
  }, []);

  const showConfirm = useCallback(async (title: string, message: string, confirmText?: string): Promise<boolean> => {
    const result = await Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmText || 'Confirmar',
      cancelButtonText: 'Cancelar',
    });
    return result.isConfirmed;
  }, []);

  const showLoading = useCallback((message: string) => {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    
    return {
      close: () => Swal.close(),
      update: (text: string) => {
        Swal.update({
          title: text,
        });
      },
    };
  }, []);

  const closeLoading = useCallback(() => {
    Swal.close();
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
    closeLoading,
  };
};

// Exportando também o tipo Notification do arquivo anterior
export interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  metadata: any;
  created_at: string;
  user_id: string;
}