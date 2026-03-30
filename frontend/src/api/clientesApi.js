import { API_BASE_URL } from './config'

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json()
    return JSON.stringify(data)
  } catch (error) {
    return fallbackMessage
  }
}

export async function fetchClientes() {
  const response = await fetch(`${API_BASE_URL}/clientes/`)
  if (!response.ok) {
    throw new Error('No se pudieron cargar los clientes')
  }
  return response.json()
}

export async function createCliente(payload) {
  const response = await fetch(`${API_BASE_URL}/clientes/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo crear el cliente'))
  }

  return response.json()
}

export async function updateCliente(id, payload) {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo actualizar el cliente'))
  }

  return response.json()
}
