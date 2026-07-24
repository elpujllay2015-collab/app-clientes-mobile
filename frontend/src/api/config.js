const browserHost = typeof window !== 'undefined' ? window.location.hostname : ''

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost'])

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (LOCAL_HOSTS.has(browserHost)
    ? 'http://127.0.0.1:8001/api'
    : 'https://app-clientes-mobile-production.up.railway.app/api')
