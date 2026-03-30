import { API_BASE_URL } from './config'

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json()
    return JSON.stringify(data)
  } catch (error) {
    return fallbackMessage
  }
}

export async function fetchProveedores() {
  const response = await fetch(`${API_BASE_URL}/proveedores/`)
  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudieron cargar los proveedores'))
  }
  return response.json()
}

export async function createProveedor(payload) {
  const response = await fetch(`${API_BASE_URL}/proveedores/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo crear el proveedor'))
  }

  return response.json()
}

export async function updateProveedor(id, payload) {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo actualizar el proveedor'))
  }

  return response.json()
}
