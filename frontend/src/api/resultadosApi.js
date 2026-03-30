import { API_BASE_URL } from './config'

export async function fetchResumenResultados(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query
    ? `${API_BASE_URL}/dashboard/resumen/?${query}`
    : `${API_BASE_URL}/dashboard/resumen/`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('No se pudo cargar el resumen de resultados')
  }
  return response.json()
}

export async function fetchResultadosVentas(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query
    ? `${API_BASE_URL}/resultados/ventas/?${query}`
    : `${API_BASE_URL}/resultados/ventas/`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('No se pudo cargar el listado de resultados')
  }
  return response.json()
}


export async function fetchResultadosPorProveedor(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query
    ? `${API_BASE_URL}/resultados/proveedores/?${query}`
    : `${API_BASE_URL}/resultados/proveedores/`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('No se pudo cargar el resumen por proveedor')
  }
  return response.json()
}
