import { API_BASE_URL } from './config'
import { getAccessToken, refreshAccessToken } from '../auth/auth'

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') {
      return data.detail
    }
    return JSON.stringify(data)
  } catch {
    return fallbackMessage
  }
}

function buildHeaders(customHeaders = {}, token = getAccessToken()) {
  const headers = { ...customHeaders }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function apiRequest(path, options = {}, retried = false) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  })

  if (response.status === 401 && !retried) {
    try {
      const nextAccessToken = await refreshAccessToken()
      return apiRequest(
        path,
        {
          ...options,
          headers: {
            ...buildHeaders(options.headers),
            Authorization: `Bearer ${nextAccessToken}`,
          },
        },
        true,
      )
    } catch (error) {
      throw error
    }
  }

  return response
}

export async function apiJson(path, options = {}, fallbackMessage = 'No se pudo completar la operación') {
  const response = await apiRequest(path, options)

  if (!response.ok) {
    throw new Error(await parseError(response, fallbackMessage))
  }

  return response.json()
}
