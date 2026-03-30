import { useEffect, useMemo, useState } from 'react'
import HomePage from './pages/HomePage'
import ClientesPage from './pages/ClientesPage'
import ProductosPage from './pages/ProductosPage'
import ProveedoresPage from './pages/ProveedoresPage'
import NuevaVentaPage from './pages/NuevaVentaPage'
import PagosPage from './pages/PagosPage'
import CuentaCorrientePage from './pages/CuentaCorrientePage'
import ResultadosPage from './pages/ResultadosPage'
import MobileLayout from './layouts/MobileLayout'
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
}

const SPLASH_STORAGE_KEY = 'nerca-poquet-splash-seen'
const SPLASH_LEAVE_MS = 3450
const SPLASH_HIDE_MS = 4150

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
      default:
        return <HomePage onNavigate={setTab} />
    }
  }, [tab])

  return (
    <>
      {showSplash ? <SplashIntro leaving={splashLeaving} /> : null}
      <MobileLayout
        title={TABS[tab]}
        activeTab={tab}
        onChangeTab={setTab}
      >
        {content}
      </MobileLayout>
    </>
  )
}
