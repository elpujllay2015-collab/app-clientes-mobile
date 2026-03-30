import { useEffect, useMemo, useState } from 'react'
import { fetchClientes } from '../api/clientesApi'
import { fetchVentas } from '../api/ventasApi'
import { fetchPagos } from '../api/pagosApi'

const primaryActions = [
  { key: 'ventas', title: 'Nueva venta', subtitle: 'Registrar venta', icon: '🧾', tone: 'sale' },
  { key: 'pagos', title: 'Registrar pago', subtitle: 'Aplicar cobro', icon: '💵', tone: 'payment' },
  { key: 'clientes', title: 'Clientes', subtitle: 'Altas y saldos', icon: '👥', tone: 'clients' },
  { key: 'cuenta', title: 'Cta Cte', subtitle: 'Ver cuenta', icon: '📒', tone: 'account' },
]

const secondaryActions = [
  { key: 'productos', title: 'Productos', subtitle: 'Altas y precios', icon: '📦', tone: 'products' },
  { key: 'proveedores', title: 'Proveedores', subtitle: 'Gestión', icon: '🏢', tone: 'account' },
  { key: 'resultados', title: 'Resultados', subtitle: 'Res. Vta', icon: '📊', tone: 'results' },
]

function money(value) {
  return `$ ${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

function todayIsoLocal() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

function badgeMeta(estado) {
  if (estado === 'PAGADO') return { label: 'Pagado', className: 'home-badge-paid' }
  if (estado === 'PARCIAL') return { label: 'Parcial', className: 'home-badge-partial' }
  return { label: 'Pendiente', className: 'home-badge-pending' }
}

export default function HomePage({ onNavigate }) {
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([fetchClientes(), fetchVentas(), fetchPagos()])
      .then(([clientesData, ventasData, pagosData]) => {
        if (!active) return
        setClientes(clientesData)
        setVentas(ventasData)
        setPagos(pagosData)
      })
      .catch(() => {
        if (!active) return
        setError('No se pudo cargar el inicio')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const dashboard = useMemo(() => {
    const today = todayIsoLocal()
    const ventasHoy = ventas.filter((venta) => String(venta.fecha_compra) === today)
    const pagosHoy = pagos.filter((pago) => String(pago.fecha_pago) === today)

    const vendidoHoy = ventasHoy.reduce((acc, venta) => acc + Number(venta.total_venta || 0), 0)
    const cobradoHoy = pagosHoy.reduce((acc, pago) => acc + Number(pago.monto || 0), 0)
    const pendienteTotal = ventas.reduce((acc, venta) => acc + Number(venta.saldo_pendiente || 0), 0)

    const clientesDestacados = clientes
      .map((cliente) => {
        const ventasCliente = ventas.filter((venta) => venta.cliente_nombre_snapshot === cliente.nombre)
        const saldo = ventasCliente.reduce((acc, venta) => acc + Number(venta.saldo_pendiente || 0), 0)
        const tienePagos = ventasCliente.some((venta) => Number(venta.total_pagado || 0) > 0)
        return {
          id: cliente.id,
          nombre: cliente.nombre,
          cuit: cliente.cuit || '-',
          saldo,
          estado: saldo <= 0 ? 'PAGADO' : tienePagos ? 'PARCIAL' : 'PENDIENTE',
        }
      })
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 3)

    const ventasRecientes = [...ventas]
      .sort((a, b) => {
        const keyA = `${a.fecha_compra}-${String(a.id).padStart(10, '0')}`
        const keyB = `${b.fecha_compra}-${String(b.id).padStart(10, '0')}`
        return keyB.localeCompare(keyA)
      })
      .slice(0, 3)

    return {
      vendidoHoy,
      cobradoHoy,
      pendienteTotal,
      clientesDestacados,
      ventasRecientes,
    }
  }, [clientes, ventas, pagos])

  return (
    <div className="home-screen">
      {error && <article className="list-card error-card">{error}</article>}
      {loading && <article className="list-card">Cargando inicio...</article>}

      {!loading && (
        <>
          <section className="home-hero-card">
            <span className="home-hero-kicker">CUENTA CORRIENTE</span>
            <h1 className="home-hero-title">Ventas y Cobros</h1>
            <p className="home-hero-text">App simple profesional para celular</p>
          </section>

          <section className="home-actions-grid">
            {primaryActions.map((action) => (
              <button
                key={action.key}
                className={`home-action-card home-action-card-${action.tone}`}
                type="button"
                onClick={() => onNavigate(action.key)}
              >
                <span className={`home-action-icon-wrap home-action-icon-wrap-${action.tone}`}>
                  <span className="home-action-icon" aria-hidden="true">{action.icon}</span>
                </span>
                <span className="home-action-title">{action.title}</span>
                <span className="home-action-subtitle">{action.subtitle}</span>
              </button>
            ))}
          </section>

          <section className="home-actions-grid home-actions-grid-secondary">
            {secondaryActions.map((action) => (
              <button
                key={action.key}
                className={`home-action-card home-action-card-secondary home-action-card-${action.tone}`}
                type="button"
                onClick={() => onNavigate(action.key)}
              >
                <span className={`home-action-icon-wrap home-action-icon-wrap-${action.tone}`}>
                  <span className="home-action-icon" aria-hidden="true">{action.icon}</span>
                </span>
                <span className="home-action-title">{action.title}</span>
                <span className="home-action-subtitle">{action.subtitle}</span>
              </button>
            ))}
          </section>

          <section className="home-dark-summary-card">
            <div className="home-dark-summary-title">Resumen del día</div>
            <div className="home-dark-summary-grid">
              <div>
                <span className="home-dark-summary-label">Vendido</span>
                <strong>{money(dashboard.vendidoHoy)}</strong>
              </div>
              <div>
                <span className="home-dark-summary-label">Cobrado</span>
                <strong>{money(dashboard.cobradoHoy)}</strong>
              </div>
              <div>
                <span className="home-dark-summary-label">Pendiente</span>
                <strong>{money(dashboard.pendienteTotal)}</strong>
              </div>
            </div>
          </section>

          <section className="home-section-header">
            <strong>Clientes</strong>
            <button className="home-inline-link" type="button" onClick={() => onNavigate('clientes')}>
              Saldo actual
            </button>
          </section>

          <section className="stack">
            {dashboard.clientesDestacados.map((cliente) => {
              const badge = badgeMeta(cliente.estado)
              return (
                <article className="home-client-card" key={cliente.id}>
                  <div className="home-client-card-top">
                    <div>
                      <div className="home-client-name">{cliente.nombre}</div>
                      <div className="home-client-subtitle">CUIT {cliente.cuit}</div>
                    </div>
                    <span className={`home-badge ${badge.className}`}>{badge.label}</span>
                  </div>

                  <div className="home-client-balance">{money(cliente.saldo)}</div>

                  <div className="home-client-actions">
                    <button className="home-primary-action" type="button" onClick={() => onNavigate('cuenta')}>
                      Ver cuenta
                    </button>
                    <button className="home-secondary-action" type="button" onClick={() => onNavigate('pagos')}>
                      Registrar pago
                    </button>
                  </div>
                </article>
              )
            })}
          </section>

          <section className="home-section-header">
            <strong>Ventas recientes</strong>
            <button className="home-inline-link" type="button" onClick={() => onNavigate('resultados')}>
              Últimos movimientos
            </button>
          </section>

          <section className="stack">
            {dashboard.ventasRecientes.map((venta) => {
              const badge = badgeMeta(venta.estado)
              return (
                <article className="home-sale-card" key={venta.id}>
                  <div className="home-sale-card-top">
                    <div>
                      <div className="home-sale-title">{venta.cliente_nombre_snapshot || `Venta #${venta.id}`}</div>
                      <div className="home-sale-subtitle">{venta.fecha_compra} · Venta #{venta.id}</div>
                    </div>
                    <span className={`home-badge ${badge.className}`}>{badge.label}</span>
                  </div>

                  <div className="home-sale-total">{money(venta.total_venta)}</div>
                  <div className="home-sale-profit">Res. Vta: {money(venta.resultado_venta)}</div>
                </article>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}
