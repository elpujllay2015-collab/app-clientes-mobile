import { apiJson } from './apiClient'

export async function fetchProductos() {
  return apiJson('/productos/', {}, 'No se pudieron cargar los productos')
}

export async function createProducto(payload) {
  return apiJson('/productos/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo crear el producto')
}

export async function updateProducto(id, payload) {
  return apiJson(`/productos/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo actualizar el producto')
}
