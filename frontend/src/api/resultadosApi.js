import { apiJson } from './apiClient'

export async function fetchResumenResultados(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/dashboard/resumen/?${query}` : '/dashboard/resumen/'
  return apiJson(url, {}, 'No se pudo cargar el resumen de resultados')
}

export async function fetchResultadosVentas(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/resultados/ventas/?${query}` : '/resultados/ventas/'
  return apiJson(url, {}, 'No se pudo cargar el listado de resultados')
}

export async function fetchResultadosPorProveedor(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/resultados/proveedores/?${query}` : '/resultados/proveedores/'
  return apiJson(url, {}, 'No se pudo cargar el resumen por proveedor')
}
