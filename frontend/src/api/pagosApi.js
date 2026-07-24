import { apiJson } from './apiClient'

export async function fetchPagos() {
  return apiJson('/pagos/', {}, 'No se pudieron cargar los pagos')
}

export async function createPago(payload) {
  return apiJson('/pagos/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo registrar el pago')
}
