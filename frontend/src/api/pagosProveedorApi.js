import { apiJson } from './apiClient'

export async function fetchPagosProveedor() {
  return apiJson('/pagos-proveedor/', {}, 'No se pudieron cargar los pagos a proveedor')
}

export async function createPagoProveedor(payload) {
  return apiJson('/pagos-proveedor/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo registrar el pago a proveedor')
}
