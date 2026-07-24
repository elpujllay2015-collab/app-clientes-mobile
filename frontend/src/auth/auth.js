import { API_BASE_URL } from '../api/config'

const ACCESS_TOKEN_KEY = 'nerca_auth_access_token'
const REFRESH_TOKEN_KEY = 'nerca_auth_refresh_token'
const USER_KEY = 'nerca_auth_user'
export const AUTH_SESSION_EXPIRED_EVENT = 'nerca-auth-session-expired'
const SESSION_EXPIRED_MESSAGE = 'Tu sesión venció. Iniciá sesión nuevamente.'

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function dispatchSessionExpired(message = SESSION_EXPIRED_MESSAGE) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { message } }))
}

export function getAccessToken() {
  if (!storageAvailable()) return ''
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function getRefreshToken() {
  if (!storageAvailable()) return ''
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function getStoredUser() {
  if (!storageAvailable()) return null

  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export function saveSession({ access, refresh, user }) {
  if (!storageAvailable()) return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  if (!storageAvailable()) return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

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

export async function fetchCurrentUser(token = getAccessToken()) {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo validar la sesión'))
  }

  return response.json()
}

export async function loginUser({ username, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Usuario o contraseña incorrectos'))
  }

  const tokens = await response.json()
  const user = await fetchCurrentUser(tokens.access)
  saveSession({ access: tokens.access, refresh: tokens.refresh, user })
  return user
}

export async function changePassword({ currentPassword, newPassword, newPasswordConfirm }) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'No se pudo actualizar la contraseña'))
  }

  const data = await response.json()
  return data.detail || 'Contraseña actualizada correctamente.'
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    clearSession()
    dispatchSessionExpired()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    clearSession()
    dispatchSessionExpired()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  const data = await response.json()
  const user = getStoredUser()
  const nextRefresh = data.refresh || refresh
  saveSession({ access: data.access, refresh: nextRefresh, user })
  return data.access
}
