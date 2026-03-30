import { API_BASE_URL } from './config'

export async function fetchVentas() {
  const response = await fetch(`${API_BASE_URL}/ventas/`)
  if (!response.ok) {
    throw new Error('No se pudieron cargar las ventas')
  }
  return response.json()
}

export async function createVenta(payload) {
  const response = await fetch(`${API_BASE_URL}/ventas/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = 'No se pudo guardar la venta'
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
