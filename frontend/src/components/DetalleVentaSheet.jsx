import { useEffect, useState } from 'react'
import { fetchVenta } from '../api/ventasApi'
import { formatMoney } from '../utils/money'

// Panel (bottom-sheet) reusable con el detalle de una venta: renglones,
// pagos y saldo. Trae los datos de GET /ventas/{id}/ (items + pagos).
// Se usa en Cuenta corriente y en Pagos.

function badgeMeta(estado) {
  if (estado === 'PAGADO') return { label: 'Pagado', className: 'home-badge-paid' }
  if (estado === 'PARCIAL') return { label: 'Parcial', className: 'home-badge-partial' }
  return { label: 'Pendiente', className: 'home-badge-pending' }
}

function formatFecha(iso) {
  if (!iso) return '—'
  const [year, month, day] = String(iso).split('-')
  if (!year || !month || !day) return String(iso)
  return `${day}/${month}/${year}`
}

function formatCantidad(value) {
  const n = Number(value || 0)
  if (Number.isInteger(n)) return String(n)
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

export default function DetalleVentaSheet({ ventaId, onClose }) {
  const [venta, setVenta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ventaId) return undefined
    let active = true
    setLoading(true)
    setError('')
    setVenta(null)

    fetchVenta(ventaId)
      .then((data) => {
        if (active) setVenta(data)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el detalle de la venta.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [ventaId])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const badge = venta ? badgeMeta(venta.estado) : null
  const items = venta?.items || []
  const pagos = (venta?.pagos || []).filter((pago) => pago.activo !== false)
  const proveedorNombre = venta?.proveedor?.nombre || '—'
  const clienteNombre = venta?.cliente?.nombre || venta?.cliente_nombre_snapshot || '—'

  return (
    <div className="dv-overlay" onClick={onClose}>
      <div
        className="dv-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de venta"
      >
        <div className="dv-grip" aria-hidden="true" />

        {loading && <div className="dv-state">Cargando detalle…</div>}
        {error && <div className="dv-state dv-state-error">{error}</div>}

        {venta && !loading && (
          <>
            <div className="dv-head">
              <div className="dv-head-main">
                <div className="dv-title">Venta #{venta.id}</div>
                <div className="dv-sub">
                  Cliente: {clienteNombre}
                  <br />
                  {proveedorNombre} · {formatFecha(venta.fecha_compra)} · Factura {venta.numero_factura || '—'}
                </div>
              </div>
              {badge && <span className={`home-badge ${badge.className}`}>{badge.label}</span>}
            </div>

            <div className="dv-seclabel">Productos</div>
            {items.length === 0 ? (
              <div className="dv-empty">Esta venta no tiene renglones cargados.</div>
            ) : (
              items.map((item) => (
                <div className="dv-line" key={item.id}>
                  <div className="dv-line-info">
                    <div className="dv-line-prod">{item.producto_nombre_snapshot || item.producto?.nombre || 'Producto'}</div>
                    <div className="dv-line-qty">
                      {formatCantidad(item.cantidad)} × {formatMoney(item.precio_unitario)}
                    </div>
                  </div>
                  <div className="dv-line-sub">{formatMoney(item.total_venta)}</div>
                </div>
              ))
            )}

            <div className="dv-totbox">
              <div className="dv-tot-row dv-tot-big">
                <span>Total venta</span>
                <strong>{formatMoney(venta.total_venta)}</strong>
              </div>
              <div className="dv-tot-row">
                <span className="dv-tot-muted">Resultado (ganancia)</span>
                <span className="dv-gan">{formatMoney(venta.resultado_venta)}</span>
              </div>
            </div>

            <div className="dv-seclabel">Pagos de esta venta</div>
            {pagos.length === 0 ? (
              <div className="dv-empty">Todavía no hay pagos aplicados a esta venta.</div>
            ) : (
              pagos.map((pago) => (
                <div className="dv-pay" key={pago.id}>
                  <div className="dv-pay-info">
                    <div className="dv-pay-main">Pago #{pago.id} · {pago.forma_pago}</div>
                    <div className="dv-pay-date">{formatFecha(pago.fecha_pago)}</div>
                  </div>
                  <div className="dv-pay-amt">{formatMoney(pago.monto)}</div>
                </div>
              ))
            )}

            <div className={`dv-saldo ${Number(venta.saldo_pendiente || 0) <= 0 ? 'dv-saldo-ok' : ''}`}>
              <span>Saldo pendiente</span>
              <strong>{formatMoney(venta.saldo_pendiente)}</strong>
            </div>
          </>
        )}

        <button type="button" className="dv-close" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
