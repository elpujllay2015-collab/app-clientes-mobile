import { API_BASE_URL } from './config'

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json()
    return JSON.stringify(data)
  } catch (error) {
    return fallbackMessage
  }
}

export async function fetchProductos() {
  const response = await fetch(`${API_BASE_URL}/productos/`)
  if (!response.ok) {
    throw new Error('No se pudieron cargar los productos')
  }
  return response.json()
}

export async function createProducto(payload) {
  const response = await fetch(`${API_BASE_URL}/productos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo crear el producto'))
  }

  return response.json()
}

export async function updateProducto(id, payload) {
  const response = await fetch(`${API_BASE_URL}/productos/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo actualizar el producto'))
  }

  return response.json()
}
