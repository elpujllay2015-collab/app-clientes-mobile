import { apiJson } from './apiClient'

export async function fetchVentas() {
  return apiJson('/ventas/', {}, 'No se pudieron cargar las ventas')
}

export async function fetchVenta(id) {
  return apiJson(`/ventas/${id}/`, {}, 'No se pudo cargar el detalle de la venta')
}

export async function createVenta(payload) {
  return apiJson('/ventas/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo guardar la venta')
}
