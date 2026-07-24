import { apiJson } from './apiClient'

export async function fetchProveedores() {
  return apiJson('/proveedores/', {}, 'No se pudieron cargar los proveedores')
}

export async function createProveedor(payload) {
  return apiJson('/proveedores/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo crear el proveedor')
}

export async function updateProveedor(id, payload) {
  return apiJson(`/proveedores/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo actualizar el proveedor')
}
