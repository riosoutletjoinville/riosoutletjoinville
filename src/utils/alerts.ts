// src/utils/alerts.ts
import Swal from 'sweetalert2';
/* eslint-disable @typescript-eslint/no-explicit-any */
export const showSuccessAlert = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#10B981',
  });
};

export const showConfirmAlert = (
  title: string, 
  message: string, 
  confirmText: string = 'Sim', 
  cancelText: string = 'Não'
) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
  });
};

export const showErrorAlert = (title: string, message: string) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#EF4444',
  });
};

export const showCartSuccessAlert = (
  productTitle: string, 
  hasFrete: boolean = false, 
  freteInfo?: any
) => {
  let html = `
    <div class="text-left">
      <p class="mb-4"><strong>${productTitle}</strong> foi adicionado ao carrinho!</p>
  `;

  if (hasFrete && freteInfo) {
    html += `
      <div class="bg-green-50 border border-green-200 rounded p-3 mb-4">
        <p class="text-green-800 text-sm">
          <strong>Frete calculado:</strong> ${freteInfo.nome}<br>
          <strong>Valor:</strong> ${freteInfo.valor_formatado}<br>
          <strong>Prazo:</strong> ${freteInfo.prazo}
        </p>
      </div>
    `;
  } else {
    html += `
      <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
        <p class="text-yellow-800 text-sm">
          ⚠️ Lembre-se de calcular o frete antes de finalizar a compra.
        </p>
      </div>
    `;
  }

  html += `</div>`;

  return Swal.fire({
    title: 'Produto Adicionado!',
    html,
    icon: 'success',
    showCancelButton: true,
    confirmButtonText: 'Ir para o Checkout',
    cancelButtonText: 'Continuar Comprando',
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
  });
};

export const showFreteAlert = () => {
  return Swal.fire({
    title: 'Calcular Frete',
    text: 'Recomendamos calcular o frete antes de adicionar ao carrinho. Deseja calcular o frete agora?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Calcular Frete',
    cancelButtonText: 'Adicionar Sem Frete',
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
  });
};