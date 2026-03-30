import { API_BASE_URL } from './config'

export async function fetchPagos() {
  const response = await fetch(`${API_BASE_URL}/pagos/`)
  if (!response.ok) {
    throw new Error('No se pudieron cargar los pagos')
  }
  return response.json()
}

export async function createPago(payload) {
  const response = await fetch(`${API_BASE_URL}/pagos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = 'No se pudo registrar el pago'
    try {
      const data = await response.json()
      message = JSON.stringify(data)
    } catch (error) {
      // no-op
    }
    throw new Error(message)
  }

  return response.json()
}
