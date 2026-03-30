import { useEffect, useMemo, useState } from 'react'
import { fetchClientes } from '../api/clientesApi'
import { createPago } from '../api/pagosApi'
import { fetchVentas } from '../api/ventasApi'

function formatMoney(value) {
  const number = Number(value || 0)
  return `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PagosPage() {
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [ventaId, setVentaId] = useState('')
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState('EFECTIVO')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [clientesData, ventasData] = await Promise.all([fetchClientes(), fetchVentas()])
      setClientes(clientesData)
      setVentas(ventasData)
    } catch (err) {
      setError('No se pudieron cargar clientes y ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const ventasCliente = useMemo(() => {
    return ventas.filter((venta) => {
      if (!clienteId) return false
      const cliente = clientes.find((c) => String(c.id) === String(clienteId))
      if (!cliente) return false
      return venta.cliente_nombre_snapshot === cliente.nombre && Number(venta.saldo_pendiente || 0) > 0
    })
  }, [ventas, clientes, clienteId])

  const ventaSeleccionada = useMemo(() => ventasCliente.find((venta) => String(venta.id) === String(ventaId)), [ventasCliente, ventaId])

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!clienteId) { setError('Tenés que seleccionar un cliente'); return }
    if (!ventaId) { setError('Tenés que seleccionar una venta'); return }
    if (!monto) { setError('Tenés que ingresar un monto'); return }
    setSaving(true)
    try {
      const response = await createPago({
        fecha_pago: new Date().toISOString().slice(0, 10),
        cliente_id: Number(clienteId),
        venta_id: Number(ventaId),
        monto,
        forma_pago: formaPago,
        observaciones,
      })
      setSuccess(`Pago #${response.id} registrado correctamente`)
      setVentaId('')
      setMonto('')
      setFormaPago('EFECTIVO')
      setObservaciones('')
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack pagos-pro-page">
      {error && <article className="list-card error-card">{error}</article>}
      {success && <article className="list-card success-card">{success}</article>}
      {loading && <article className="list-card">Cargando datos...</article>}

      {!loading && (
        <>
          <article className="list-card pagos-pro-card">
            <div className="pagos-pro-card-header">
              <div>
                <span className="pagos-pro-kicker">Cobros</span>
                <strong className="pagos-pro-title">Registrar pago</strong>
                <span className="pagos-pro-subtitle">Elegí cliente, seleccioná la venta pendiente y cargá el pago.</span>
              </div>
            </div>

            <div className="pagos-pro-grid">
              <div className="pagos-pro-field">
                <span className="pagos-pro-field-label">Cliente</span>
                <select className="input pagos-pro-input" value={clienteId} onChange={(e) => { setClienteId(e.target.value); setVentaId('') }}>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pagos-pro-field">
                <span className="pagos-pro-field-label">Venta pendiente</span>
                <select className="input pagos-pro-input" value={ventaId} onChange={(e) => setVentaId(e.target.value)}>
                  <option value="">Seleccionar venta</option>
                  {ventasCliente.map((venta) => (
                    <option key={venta.id} value={venta.id}>
                      Venta #{venta.id} · Saldo {formatMoney(venta.saldo_pendiente)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>

          {ventaSeleccionada && (
            <article className="summary-card pagos-pro-summary-card">
              <div className="pagos-pro-summary-header">
                <div>
                  <span className="summary-label pagos-pro-summary-label">Venta seleccionada</span>
                  <strong className="pagos-pro-summary-title">Venta #{ventaSeleccionada.id}</strong>
                </div>
                <span className="pagos-pro-badge">Pendiente</span>
              </div>

              <div className="pagos-pro-summary-grid">
                <div className="pagos-pro-summary-box">
                  <span className="pagos-pro-mini-label">Total venta</span>
                  <strong>{formatMoney(ventaSeleccionada.total_venta)}</strong>
                </div>
                <div className="pagos-pro-summary-box">
                  <span className="pagos-pro-mini-label">Total pagado</span>
                  <strong>{formatMoney(ventaSeleccionada.total_pagado)}</strong>
                </div>
                <div className="pagos-pro-summary-box pagos-pro-summary-box-highlight">
                  <span className="pagos-pro-mini-label">Saldo pendiente</span>
                  <strong>{formatMoney(ventaSeleccionada.saldo_pendiente)}</strong>
                </div>
              </div>
            </article>
          )}

          <article className="list-card pagos-pro-card pagos-pro-payment-card">
            <div className="pagos-pro-card-header">
              <div>
                <strong className="pagos-pro-section-title">Datos del pago</strong>
                <span className="pagos-pro-subtitle">Completá el monto, el medio de pago y una observación si hace falta.</span>
              </div>
            </div>

            <div className="pagos-pro-grid">
              <div className="pagos-pro-field">
                <span className="pagos-pro-field-label">Monto</span>
                <input className="input pagos-pro-input" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </div>

              <div className="pagos-pro-field">
                <span className="pagos-pro-field-label">Forma de pago</span>
                <select className="input pagos-pro-input" value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>

            <div className="pagos-pro-field">
              <span className="pagos-pro-field-label">Observaciones</span>
              <textarea className="input pagos-pro-textarea" placeholder="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>

            <button className="primary-btn pagos-pro-primary-btn" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar pago'}
            </button>
          </article>
        </>
      )}
    </div>
  )
}
