import { useEffect, useMemo, useState } from 'react'
import HomePage from './pages/HomePage'
import ClientesPage from './pages/ClientesPage'
import ProductosPage from './pages/ProductosPage'
import ProveedoresPage from './pages/ProveedoresPage'
import NuevaVentaPage from './pages/NuevaVentaPage'
import PagosPage from './pages/PagosPage'
import CuentaCorrientePage from './pages/CuentaCorrientePage'
import ResultadosPage from './pages/ResultadosPage'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import MobileLayout from './layouts/MobileLayout'
import { AUTH_SESSION_EXPIRED_EVENT, clearSession, fetchCurrentUser, getStoredUser, isAuthenticated } from './auth/auth'
import nPieceTop from './assets/splash/n_piece_1_metal.png'
import nPieceMain from './assets/splash/n_piece_2_metal.png'
import nPieceLeft from './assets/splash/n_piece_3_metal.png'
import nPieceBottom from './assets/splash/n_piece_4_metal.png'
import nercaWordmark from './assets/splash/nerca_wordmark_metal.png'
import poquetWordmark from './assets/splash/poquet_wordmark_metal.png'

const TABS = {
  inicio: 'Inicio',
  clientes: 'Clientes',
  productos: 'Productos',
  proveedores: 'Proveedores',
  ventas: 'Nueva venta',
  pagos: 'Pagos',
  resultados: 'Resultados',
  cuenta: 'Cuenta corriente',
  password: 'Cambiar contraseña',
}

const SPLASH_STORAGE_KEY = 'nerca-poquet-splash-seen'
const SPLASH_LEAVE_MS = 4550
const SPLASH_HIDE_MS = 5250

function shouldShowSplash() {
  if (typeof window === 'undefined') {
    return false
  }

  if (import.meta.env.DEV) {
    return true
  }

  try {
    return !window.sessionStorage.getItem(SPLASH_STORAGE_KEY)
  } catch {
    return true
  }
}

function SplashIntro({ leaving }) {
  return (
    <div className={`startup-splash${leaving ? ' startup-splash-leaving' : ''}`} aria-hidden="true">
      <div className="startup-splash-scene">
        <div className="startup-lockup">
          <div className="startup-mark" role="presentation">
            <img src={nPieceTop} alt="" className="startup-piece startup-piece-top" draggable="false" />
            <img src={nPieceMain} alt="" className="startup-piece startup-piece-main" draggable="false" />
            <img src={nPieceLeft} alt="" className="startup-piece startup-piece-left" draggable="false" />
            <img src={nPieceBottom} alt="" className="startup-piece startup-piece-bottom" draggable="false" />
          </div>

          <div className="startup-word-group" role="presentation">
            <img src={nercaWordmark} alt="" className="startup-wordmark startup-wordmark-nerca" draggable="false" />
            <img src={poquetWordmark} alt="" className="startup-wordmark startup-wordmark-poquet" draggable="false" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('inicio')
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash())
  const [splashLeaving, setSplashLeaving] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => getStoredUser())
  const [authReady, setAuthReady] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')

  useEffect(() => {
    if (!showSplash) {
      return undefined
    }

    const leaveTimer = window.setTimeout(() => {
      setSplashLeaving(true)
    }, SPLASH_LEAVE_MS)

    const hideTimer = window.setTimeout(() => {
      try {
        if (!import.meta.env.DEV) {
          window.sessionStorage.setItem(SPLASH_STORAGE_KEY, '1')
        }
      } catch {
        // ignore storage errors in splash flow
      }

      setShowSplash(false)
      setSplashLeaving(false)
    }, SPLASH_HIDE_MS)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(hideTimer)
    }
  }, [showSplash])

  useEffect(() => {
    let active = true

    async function validateSession() {
      if (!isAuthenticated()) {
        if (active) {
          setCurrentUser(null)
          setAuthReady(true)
        }
        return
      }

      try {
        const user = await fetchCurrentUser()
        if (!active) return
        setCurrentUser(user)
      } catch {
        clearSession()
        if (!active) return
        setCurrentUser(null)
      } finally {
        if (active) {
          setAuthReady(true)
        }
      }
    }

    validateSession()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleSessionExpired(event) {
      clearSession()
      setCurrentUser(null)
      setAuthReady(true)
      setTab('inicio')
      setLoginMessage(event.detail?.message || 'Tu sesión venció. Iniciá sesión nuevamente.')
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [])

  function handleLoginSuccess(user) {
    setCurrentUser(user)
    setAuthReady(true)
    setTab('inicio')
    setLoginMessage('')
  }

  function handleLogout() {
    clearSession()
    setCurrentUser(null)
    setTab('inicio')
    setLoginMessage('')
  }

  function handleOpenChangePassword() {
    setTab('password')
  }

  const content = useMemo(() => {
    switch (tab) {
      case 'clientes':
        return <ClientesPage />
      case 'productos':
        return <ProductosPage />
      case 'proveedores':
        return <ProveedoresPage />
      case 'ventas':
        return <NuevaVentaPage />
      case 'pagos':
        return <PagosPage />
      case 'resultados':
        return <ResultadosPage />
      case 'cuenta':
        return <CuentaCorrientePage />
      case 'password':
        return <ChangePasswordPage onCancel={() => setTab('inicio')} />
      default:
        return <HomePage onNavigate={setTab} currentUser={currentUser} onLogout={handleLogout} onChangePassword={handleOpenChangePassword} />
    }
  }, [tab, currentUser])

  return (
    <>
      {showSplash ? <SplashIntro leaving={splashLeaving} /> : null}
      {!showSplash && authReady && !currentUser ? <LoginPage onLoginSuccess={handleLoginSuccess} initialMessage={loginMessage} /> : null}
      {!showSplash && authReady && currentUser ? (
        <MobileLayout
          title={TABS[tab]}
          activeTab={tab}
          onChangeTab={setTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onChangePassword={handleOpenChangePassword}
        >
          {content}
        </MobileLayout>
      ) : null}
    </>
  )
}
