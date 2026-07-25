import { useEffect, useMemo, useState } from 'react'
import { fetchProveedores } from '../api/proveedoresApi'
import { fetchVentas } from '../api/ventasApi'
import { fetchPagos } from '../api/pagosApi'
import { createPagoProveedor, fetchPagosProveedor } from '../api/pagosProveedorApi'
import { hoyISOLocal } from '../utils/fecha'
import { formatMoney } from '../utils/money'

export default function PagosProveedorPage({ onNavigate, currentUser }) {
  const [proveedores, setProveedores] = useState([])
  const [ventas, setVentas] = useState([])
  const [pagos, setPagos] = useState([])
  const [pagosProveedor, setPagosProveedor] = useState([])
  const [proveedorId, setProveedorId] = useState('')
  const [monto, setMonto] = useState('')
  const [formaPago, setFormaPago] = useState('TRANSFERENCIA')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const empresaNombre = currentUser?.empresa_nombre || 'mi negocio'

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [proveedoresData, ventasData, pagosData, pagosProveedorData] = await Promise.all([
        fetchProveedores(),
        fetchVentas(),
        fetchPagos(),
        fetchPagosProveedor(),
      ])
      setProveedores(proveedoresData)
      setVentas(ventasData)
      setPagos(pagosData)
      setPagosProveedor(pagosProveedorData)
    } catch (err) {
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Saldo con cada proveedor = saldo inicial + costos de sus ventas - pagos que se le hicieron.
  const saldoPorProveedor = useMemo(() => {
    const map = new Map()
    proveedores.forEach((proveedor) => {
      map.set(String(proveedor.id), Number(proveedor.saldo_inicial || 0))
    })
    const proveedorDeVenta = new Map()
    ventas.forEach((venta) => {
      proveedorDeVenta.set(String(venta.id), venta.proveedor != null ? String(venta.proveedor) : '')
      if (venta.activa === false) return
      const key = venta.proveedor != null ? String(venta.proveedor) : ''
      if (!key || !map.has(key)) return
      map.set(key, Number(map.get(key) || 0) + Number(venta.total_costo || 0))
    })
    pagosProveedor.forEach((pago) => {
      if (pago.activo === false) return
      const key = pago.proveedor != null ? String(pago.proveedor) : ''
      if (!key || !map.has(key)) return
      map.set(key, Number(map.get(key) || 0) - Number(pago.monto || 0))
    })
    // Pagos de clientes que fueron DIRECTO al proveedor de la venta (Etapa 3).
    pagos.forEach((pago) => {
      if (pago.activo === false || !pago.directo_a_proveedor || pago.venta == null) return
      const key = proveedorDeVenta.get(String(pago.venta)) || ''
      if (!key || !map.has(key)) return
      map.set(key, Number(map.get(key) || 0) - Number(pago.monto || 0))
    })
    return map
  }, [proveedores, ventas, pagosProveedor, pagos])

  // Mi caja = lo que me pagaron los clientes (a mí) - lo que le pagué a los proveedores.
  // Los pagos de clientes "directo al proveedor" NO pasan por la caja.
  const miCaja = useMemo(() => {
    const cobrado = pagos.reduce((acc, pago) => acc + (pago.activo === false || pago.directo_a_proveedor ? 0 : Number(pago.monto || 0)), 0)
    const pagado = pagosProveedor.reduce((acc, pago) => acc + (pago.activo === false ? 0 : Number(pago.monto || 0)), 0)
    return cobrado - pagado
  }, [pagos, pagosProveedor])

  const proveedoresOrdenados = useMemo(
    () => [...proveedores].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' })),
    [proveedores],
  )

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!proveedorId) {
      setError('Tenés que seleccionar un proveedor')
      return
    }
    if (!monto) {
      setError('Tenés que ingresar un monto')
      return
    }
    setSaving(true)
    try {
      const response = await createPagoProveedor({
        fecha_pago: hoyISOLocal(),
        proveedor: Number(proveedorId),
        monto,
        forma_pago: formaPago,
        observaciones,
      })
      setSuccess(`Pago #${response.id} registrado correctamente`)
      setMonto('')
      setObservaciones('')
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack" style={{ gap: '14px' }}>
      {onNavigate && (
        <div style={{ display: 'flex' }}>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => onNavigate('proveedores')}
            style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c9d6e3', background: '#f7fafc', fontWeight: 700, color: '#133b5c' }}
          >
            ← Volver a Proveedores
          </button>
        </div>
      )}

      {error && <article className="list-card error-card">{error}</article>}
      {success && <article className="list-card success-card">{success}</article>}
      {loading && <article className="list-card">Cargando datos...</article>}

      {!loading && (
        <>
          <article
            className="summary-card"
            style={{
              borderRadius: '18px',
              padding: '18px',
              border: '1px solid #d7e1ea',
              background: 'linear-gradient(180deg, #f5fff8 0%, #ffffff 100%)',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#5b7083' }}>Caja {empresaNombre}</span>
            <strong style={{ display: 'block', fontSize: '28px', color: miCaja >= 0 ? '#027a48' : '#b42318', marginTop: '4px' }}>
              {formatMoney(miCaja)}
            </strong>
            <span style={{ fontSize: '12px', color: '#5b7083' }}>Cobrado a clientes − pagado a proveedores</span>
          </article>

          <article className="list-card" style={{ borderRadius: '18px', padding: '16px', display: 'grid', gap: '12px' }}>
            <strong style={{ fontSize: '18px', color: '#0f2233' }}>Registrar pago a proveedor</strong>

            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#5b7083' }}>Proveedor</span>
              <select className="input" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Seleccionar proveedor</option>
                {proveedoresOrdenados.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre} · Le debés {formatMoney(saldoPorProveedor.get(String(proveedor.id)) || 0)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#5b7083' }}>Monto</span>
              <input className="input" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#5b7083' }}>Forma de pago</span>
              <select className="input" value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="DEBITO">Débito</option>
                <option value="CREDITO">Crédito</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#5b7083' }}>Observaciones</span>
              <textarea className="input" placeholder="Observaciones (opcional)" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>

            <button className="primary-btn" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar pago'}
            </button>
          </article>

          <article className="list-card" style={{ borderRadius: '18px', padding: '16px' }}>
            <strong style={{ fontSize: '18px', color: '#0f2233' }}>Pagos a proveedores</strong>
            <span style={{ color: '#5b7083', display: 'block', marginTop: '2px' }}>{pagosProveedor.length} registrados</span>
          </article>

          {pagosProveedor.length === 0 && (
            <article className="list-card" style={{ color: '#5b7083' }}>Todavía no registraste pagos a proveedores.</article>
          )}

          {pagosProveedor.map((pago) => (
            <article key={pago.id} className="list-card" style={{ borderRadius: '18px', padding: '16px', display: 'grid', gap: '4px' }}>
              <strong style={{ fontSize: '16px', color: '#0f2233' }}>{pago.proveedor_nombre || 'Proveedor'}</strong>
              <span>Monto: {formatMoney(pago.monto)}</span>
              <span>Fecha: {pago.fecha_pago}</span>
              <span>Forma: {pago.forma_pago}</span>
              {pago.observaciones ? <span>Obs: {pago.observaciones}</span> : null}
            </article>
          ))}
        </>
      )}
    </div>
  )
}
