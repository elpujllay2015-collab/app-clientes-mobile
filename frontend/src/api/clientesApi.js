import { apiJson } from './apiClient'

export async function fetchClientes() {
  return apiJson('/clientes/', {}, 'No se pudieron cargar los clientes')
}

export async function createCliente(payload) {
  return apiJson('/clientes/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo crear el cliente')
}

export async function updateCliente(id, payload) {
  return apiJson(`/clientes/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }, 'No se pudo actualizar el cliente')
}
