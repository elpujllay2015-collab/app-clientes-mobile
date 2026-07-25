import { useEffect } from 'react'
import { formatMoney } from '../utils/money'

// Modal de revisión de la venta completa antes de guardar. Muestra cliente,
// proveedor, factura, todos los ítems (con costo y venta por unidad + subtotal)
// y los totales. Confirmar recién guarda; "Volver a editar" cierra sin guardar.

function formatCantidad(value) {
  const n = Number(value || 0)
  if (Number.isInteger(n)) return String(n)
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

export default function ConfirmarVentaModal({
  clienteNombre,
  proveedorNombre,
  numeroFactura,
  lineas,
  totalCosto,
  totalVenta,
  totalResultado,
  saving,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, saving])

  return (
    <div className="dv-overlay" onClick={saving ? undefined : onCancel}>
      <div
        className="dv-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar venta"
      >
        <div className="dv-grip" aria-hidden="true" />

        <div className="dv-head">
          <div className="dv-head-main">
            <div className="dv-title">Revisá la venta</div>
            <div className="dv-sub">Confirmá que esté todo bien antes de guardar.</div>
          </div>
        </div>

        <div className="cv-meta">
          <div><span className="cv-meta-k">Cliente:</span> {clienteNombre || '—'}</div>
          <div>
            <span className="cv-meta-k">Proveedor:</span> {proveedorNombre || '—'} ·{' '}
            <span className="cv-meta-k">Factura:</span> {numeroFactura || '—'}
          </div>
        </div>

        <div className="dv-seclabel">Productos ({lineas.length})</div>
        <div className="cv-list">
          {lineas.map((linea, index) => (
            <div className="dv-line" key={index}>
              <div className="dv-line-info">
                <div className="dv-line-prod">{linea.nombre}</div>
                <div className="dv-line-qty">
                  {formatCantidad(linea.cantidad)} · costo {formatMoney(linea.costo)} · venta {formatMoney(linea.precio)}
                </div>
              </div>
              <div className="dv-line-sub">{formatMoney(linea.subtotal)}</div>
            </div>
          ))}
        </div>

        <div className="dv-totbox">
          <div className="dv-tot-row dv-tot-big">
            <span>Total venta</span>
            <strong>{formatMoney(totalVenta)}</strong>
          </div>
          <div className="dv-tot-row">
            <span className="dv-tot-muted">Total costo</span>
            <span className="cv-val">{formatMoney(totalCosto)}</span>
          </div>
          <div className="dv-tot-row">
            <span className="dv-tot-muted">Resultado (ganancia)</span>
            <span className="cv-val dv-gan">{formatMoney(totalResultado)}</span>
          </div>
        </div>

        <div className="cv-actions">
          <button type="button" className="cv-btn cv-btn-confirm" onClick={onConfirm} disabled={saving}>
            {saving ? 'Guardando...' : 'Confirmar y guardar venta'}
          </button>
          <button type="button" className="cv-btn cv-btn-back" onClick={onCancel} disabled={saving}>
            Volver a editar
          </button>
        </div>
      </div>
    </div>
  )
}
