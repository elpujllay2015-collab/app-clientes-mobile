import { useEffect, useState } from 'react'
import { fetchResumenResultados, fetchResultadosPorProveedor, fetchResultadosVentas } from '../api/resultadosApi'
import { fetchProveedores } from '../api/proveedoresApi'

function formatMoney(value) {
  const number = Number(value || 0)
  return `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function ResultadosPage() {
  const [fechaDesde, setFechaDesde] = useState(todayIso())
  const [fechaHasta, setFechaHasta] = useState(todayIso())
  const [resumen, setResumen] = useState(null)
  const [ventas, setVentas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [catalogoProveedores, setCatalogoProveedores] = useState([])
  const [proveedorId, setProveedorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = { fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...(proveedorId ? { proveedor_id: proveedorId } : {}) }
      const [resumenData, ventasData, proveedoresData, proveedoresCatalogo] = await Promise.all([
        fetchResumenResultados(params),
        fetchResultadosVentas(params),
        fetchResultadosPorProveedor(params),
        fetchProveedores(),
      ])
      setResumen(resumenData)
      setVentas(ventasData)
      setProveedores(proveedoresData)
      setCatalogoProveedores(proveedoresCatalogo)
    } catch (err) {
      setError('No se pudieron cargar los resultados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="stack">
      <article className="list-card">
        <strong>Filtro de período</strong>
        <div className="filters-grid resultados-filter-grid">
          <input
            className="input"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
          <select
            className="input resultados-filter-select"
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {catalogoProveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-btn" type="button" onClick={load}>
          Actualizar resultados
        </button>
      </article>

      {loading && <article className="list-card">Cargando resultados...</article>}
      {error && <article className="list-card error-card">{error}</article>}

      {!loading && !error && resumen && (
        <>
          <section className="summary-grid">
            <article className="summary-card">
              <span className="summary-label">Total costo</span>
              <strong>{formatMoney(resumen.total_costo)}</strong>
            </article>
            <article className="summary-card">
              <span className="summary-label">Total venta</span>
              <strong>{formatMoney(resumen.total_venta)}</strong>
            </article>
            <article className="summary-card">
              <span className="summary-label">Res. Vta</span>
              <strong>{formatMoney(resumen.resultado_venta)}</strong>
            </article>
            <article className="summary-card">
              <span className="summary-label">Cobrado</span>
              <strong>{formatMoney(resumen.total_pagado)}</strong>
            </article>
            <article className="summary-card">
              <span className="summary-label">Pendiente</span>
              <strong>{formatMoney(resumen.saldo_pendiente)}</strong>
            </article>
            <article className="summary-card">
              <span className="summary-label">Ventas del período</span>
              <strong>{resumen.cantidad_ventas}</strong>
            </article>
          </section>

          <article className="resultados-proveedores-header-card">
            <strong className="resultados-proveedores-header-title">Resultados por proveedor</strong>
            <span className="resultados-proveedores-header-subtitle">Venta, costo, resultado, cobrado y deuda total de clientes por proveedor.</span>
            {proveedorId && (
              <span className="resultados-proveedores-active-filter">
                Filtro activo: {catalogoProveedores.find((proveedor) => String(proveedor.id) === String(proveedorId))?.nombre || 'Proveedor'}
              </span>
            )}
          </article>

          {proveedores.length === 0 && (
            <article className="list-card">No hay resultados por proveedor en ese período.</article>
          )}

          {proveedores.map((proveedor) => (
            <article className="resultados-proveedor-card" key={proveedor.proveedor_id ?? `sin-proveedor-${proveedor.proveedor_nombre}`}>
              <div className="resultados-proveedor-top">
                <div>
                  <strong className="resultados-proveedor-name">{proveedor.proveedor_nombre}</strong>
                  <span className="resultados-proveedor-sales">{proveedor.cantidad_ventas} ventas asociadas</span>
                </div>
                <span className="resultados-proveedor-badge">Debe {formatMoney(proveedor.saldo_pendiente)}</span>
              </div>

              <div className="resultados-proveedor-grid">
                <div className="resultados-proveedor-metric">
                  <span className="summary-label">Total venta</span>
                  <strong>{formatMoney(proveedor.total_venta)}</strong>
                </div>
                <div className="resultados-proveedor-metric">
                  <span className="summary-label">Total costo</span>
                  <strong>{formatMoney(proveedor.total_costo)}</strong>
                </div>
                <div className="resultados-proveedor-metric">
                  <span className="summary-label">Resultado</span>
                  <strong>{formatMoney(proveedor.resultado_venta)}</strong>
                </div>
                <div className="resultados-proveedor-metric">
                  <span className="summary-label">Cobrado</span>
                  <strong>{formatMoney(proveedor.total_pagado)}</strong>
                </div>
                <div className="resultados-proveedor-metric resultados-proveedor-metric-highlight">
                  <span className="summary-label">Deuda total clientes</span>
                  <strong>{formatMoney(proveedor.saldo_pendiente)}</strong>
                </div>
              </div>

              <div className="resultados-proveedor-clients-block">
                <strong className="resultados-proveedor-clients-title">Clientes que deben a este proveedor</strong>

                {proveedor.clientes.length === 0 && (
                  <span className="resultados-proveedor-empty">No hay deuda pendiente para este proveedor.</span>
                )}

                {proveedor.clientes.map((cliente) => (
                  <div className="resultados-proveedor-client-row" key={`${proveedor.proveedor_id ?? 'sin'}-${cliente.cliente_id}`}>
                    <span className="resultados-proveedor-client-name">{cliente.cliente_nombre}</span>
                    <strong className="resultados-proveedor-client-balance">{formatMoney(cliente.saldo_pendiente)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <article className="list-card">
            <strong>Ventas del período</strong>
          </article>

          {ventas.length === 0 && (
            <article className="list-card">No hay ventas en ese período.</article>
          )}

          {ventas.map((venta) => (
            <article className="list-card" key={venta.id}>
              <strong>Venta #{venta.id} · {venta.cliente_nombre_snapshot}</strong>
              <span>Fecha: {venta.fecha_compra}</span>
              <span>Factura: {venta.numero_factura || '-'}</span>
              <span>Total costo: {formatMoney(venta.total_costo)}</span>
              <span>Total venta: {formatMoney(venta.total_venta)}</span>
              <span>Res. Vta: {formatMoney(venta.resultado_venta)}</span>
              <span>Total pagado: {formatMoney(venta.total_pagado)}</span>
              <span>Saldo pendiente: {formatMoney(venta.saldo_pendiente)}</span>
              <span>Estado: {venta.estado}</span>
            </article>
          ))}
        </>
      )}
    </div>
  )
}
