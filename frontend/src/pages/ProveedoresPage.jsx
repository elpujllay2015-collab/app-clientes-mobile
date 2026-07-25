import { useEffect, useMemo, useState } from 'react'
import { createProveedor, fetchProveedores, updateProveedor } from '../api/proveedoresApi'
import { fetchVentas } from '../api/ventasApi'
import { fetchPagos } from '../api/pagosApi'
import { fetchPagosProveedor } from '../api/pagosProveedorApi'
import { formatMoney } from '../utils/money'

const emptyForm = {
  nombre: '',
  saldo_inicial: '',
}

function normalizeSaldoInput(value) {
  return String(value ?? '').replace('.', ',')
}

export default function ProveedoresPage({ onNavigate, currentUser }) {
  const [proveedores, setProveedores] = useState([])
  const [ventas, setVentas] = useState([])
  const [pagosProveedor, setPagosProveedor] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [detalleId, setDetalleId] = useState(null)
  const empresaNombre = currentUser?.empresa_nombre || 'mi negocio'

  async function loadProveedores() {
    setLoading(true)
    setError('')
    try {
      const [proveedoresData, ventasData, pagosProveedorData, pagosData] = await Promise.all([fetchProveedores(), fetchVentas(), fetchPagosProveedor(), fetchPagos()])
      setProveedores(proveedoresData)
      setVentas(ventasData)
      setPagosProveedor(pagosProveedorData)
      setPagos(pagosData)
    } catch (err) {
      setError('No se pudieron cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProveedores()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return proveedores
    return proveedores.filter((proveedor) => String(proveedor.nombre || '').toLowerCase().includes(q))
  }, [proveedores, query])

  // Saldo con cada proveedor = saldo inicial + costos de sus ventas (todavía sin pagos, esos vienen en la Etapa 2).
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

  // Detalle (cuenta corriente) del proveedor seleccionado con "Ver cuenta".
  const detalle = useMemo(() => {
    if (detalleId == null) return null
    const key = String(detalleId)
    const proveedor = proveedores.find((p) => String(p.id) === key)
    if (!proveedor) return null

    const proveedorDeVenta = new Map()
    ventas.forEach((v) => proveedorDeVenta.set(String(v.id), v.proveedor != null ? String(v.proveedor) : ''))

    const ventasProveedor = ventas.filter((v) => v.activa !== false && String(v.proveedor) === key)
    const totalCostos = ventasProveedor.reduce((acc, v) => acc + Number(v.total_costo || 0), 0)

    const pagosEmpresa = pagosProveedor.filter((p) => p.activo !== false && String(p.proveedor) === key)
    const pagosDirectos = pagos.filter(
      (p) => p.activo !== false && p.directo_a_proveedor && p.venta != null && proveedorDeVenta.get(String(p.venta)) === key,
    )
    const totalPagado =
      pagosEmpresa.reduce((acc, p) => acc + Number(p.monto || 0), 0) +
      pagosDirectos.reduce((acc, p) => acc + Number(p.monto || 0), 0)

    const nombreClienteDeVenta = (ventaId) => {
      const v = ventas.find((x) => String(x.id) === String(ventaId))
      return v ? v.cliente_nombre_snapshot : ''
    }

    return {
      proveedor,
      saldoInicial: Number(proveedor.saldo_inicial || 0),
      totalCostos,
      totalPagado,
      saldoActual: Number(saldoPorProveedor.get(key) || 0),
      ventasProveedor,
      pagosEmpresa,
      pagosDirectos,
      nombreClienteDeVenta,
    }
  }, [detalleId, proveedores, ventas, pagosProveedor, pagos, saldoPorProveedor])

  function resetFormState() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleEdit(proveedor) {
    setError('')
    setSuccess('')
    setEditingId(proveedor.id)
    setForm({ nombre: proveedor.nombre || '', saldo_inicial: normalizeSaldoInput(proveedor.saldo_inicial) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setError('')
    setSuccess('')

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    const saldoInicial = String(form.saldo_inicial || '').trim()
    if (saldoInicial && Number.isNaN(Number(saldoInicial.replace(',', '.')))) {
      setError('El saldo inicial debe ser un número válido')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        saldo_inicial: saldoInicial ? Number(saldoInicial.replace(',', '.')).toFixed(2) : '0.00',
        activo: true,
      }
      if (editingId) {
        await updateProveedor(editingId, payload)
        setSuccess('Proveedor actualizado correctamente')
      } else {
        await createProveedor(payload)
        setSuccess('Proveedor creado correctamente')
      }
      resetFormState()
      await loadProveedores()
    } catch (err) {
      setError(err.message || (editingId ? 'No se pudo actualizar el proveedor' : 'No se pudo crear el proveedor'))
    } finally {
      setSaving(false)
    }
  }

  if (detalle) {
    const { proveedor, saldoInicial, totalCostos, totalPagado, saldoActual, ventasProveedor, pagosEmpresa, pagosDirectos, nombreClienteDeVenta } = detalle
    const saldoColor = saldoActual > 0 ? '#b42318' : saldoActual < 0 ? '#027a48' : '#0f2233'
    const totalPagos = pagosEmpresa.length + pagosDirectos.length
    return (
      <div className="stack proveedores-pro-page" style={{ gap: '14px' }}>
        <div style={{ display: 'flex' }}>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => setDetalleId(null)}
            style={{ borderRadius: '12px', padding: '10px 14px', border: '1px solid #c9d6e3', background: '#f7fafc', fontWeight: 700, color: '#133b5c' }}
          >
            ← Volver a proveedores
          </button>
        </div>

        <article className="summary-card" style={{ borderRadius: '20px', padding: '18px', border: '1px solid #d7e1ea', background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)', boxShadow: '0 12px 28px rgba(15,23,42,0.06)' }}>
          <span style={{ fontSize: '12px', color: '#5b7083' }}>Proveedor</span>
          <strong style={{ display: 'block', fontSize: '24px', color: '#0f2233', margin: '4px 0 8px' }}>{proveedor.nombre}</strong>
          <span style={{ fontSize: '12px', color: '#5b7083' }}>Le debés</span>
          <strong style={{ display: 'block', fontSize: '28px', color: saldoColor }}>{formatMoney(saldoActual)}</strong>
        </article>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
          {[
            ['Saldo inicial', saldoInicial],
            ['Total en costos', totalCostos],
            ['Total pagado', totalPagado],
            ['Saldo actual', saldoActual],
          ].map(([label, value]) => (
            <article key={label} className="summary-card" style={{ borderRadius: '16px', border: '1px solid #d7e1ea', padding: '14px', background: '#fff', boxShadow: '0 8px 20px rgba(15,23,42,0.05)' }}>
              <span style={{ fontSize: '12px', color: '#5b7083' }}>{label}</span>
              <strong style={{ display: 'block', fontSize: '17px', color: '#0f2233', marginTop: '4px' }}>{formatMoney(value)}</strong>
            </article>
          ))}
        </section>

        <article className="list-card" style={{ borderRadius: '18px', padding: '16px' }}>
          <strong style={{ fontSize: '18px', color: '#0f2233' }}>Ventas de este proveedor</strong>
          <span style={{ color: '#5b7083', display: 'block', marginTop: '2px' }}>{ventasProveedor.length} registradas</span>
        </article>
        {ventasProveedor.length === 0 && <article className="list-card" style={{ color: '#5b7083' }}>Sin ventas de este proveedor.</article>}
        {ventasProveedor.map((v) => (
          <article key={v.id} className="list-card" style={{ borderRadius: '18px', padding: '16px', display: 'grid', gap: '4px' }}>
            <strong style={{ fontSize: '16px', color: '#0f2233' }}>Venta #{v.id} · {v.cliente_nombre_snapshot}</strong>
            <span>Fecha: {v.fecha_compra}</span>
            <span>Costo: {formatMoney(v.total_costo)}</span>
            <span>Total venta: {formatMoney(v.total_venta)}</span>
          </article>
        ))}

        <article className="list-card" style={{ borderRadius: '18px', padding: '16px' }}>
          <strong style={{ fontSize: '18px', color: '#0f2233' }}>Pagos a este proveedor</strong>
          <span style={{ color: '#5b7083', display: 'block', marginTop: '2px' }}>{totalPagos} registrados</span>
        </article>
        {totalPagos === 0 && <article className="list-card" style={{ color: '#5b7083' }}>Sin pagos a este proveedor.</article>}
        {pagosEmpresa.map((p) => (
          <article key={`e-${p.id}`} className="list-card" style={{ borderRadius: '18px', padding: '16px', display: 'grid', gap: '4px' }}>
            <strong style={{ fontSize: '16px', color: '#0f2233' }}>Pago de {empresaNombre}</strong>
            <span>Monto: {formatMoney(p.monto)}</span>
            <span>Fecha: {p.fecha_pago}</span>
            <span>Forma: {p.forma_pago}</span>
          </article>
        ))}
        {pagosDirectos.map((p) => (
          <article key={`d-${p.id}`} className="list-card" style={{ borderRadius: '18px', padding: '16px', display: 'grid', gap: '4px' }}>
            <strong style={{ fontSize: '16px', color: '#0f2233' }}>Pago directo del cliente</strong>
            <span>Cliente: {nombreClienteDeVenta(p.venta)}</span>
            <span>Monto: {formatMoney(p.monto)}</span>
            <span>Fecha: {p.fecha_pago}</span>
            <span>Forma: {p.forma_pago}</span>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="stack proveedores-pro-page">
      {error && <article className="list-card error-card">{error}</article>}
      {success && <article className="list-card success-card">{success}</article>}

      <article className="proveedores-pro-form-card">
        <div className="proveedores-pro-card-header">
          <div>
            <span className="proveedores-pro-kicker">GESTIÓN DE PROVEEDORES</span>
            <strong className="proveedores-pro-title">{editingId ? 'Editar proveedor' : 'Alta de proveedor'}</strong>
            <span className="proveedores-pro-subtitle">Cargá proveedores para asociarlos a las ventas</span>
          </div>
        </div>

        <div className="proveedores-pro-form-grid">
          <input
            className="input proveedores-pro-input"
            placeholder="Nombre del proveedor"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <input
            className="input proveedores-pro-input"
            placeholder="Saldo inicial (lo que ya le debías)"
            value={form.saldo_inicial}
            onChange={(e) => setForm((f) => ({ ...f, saldo_inicial: e.target.value }))}
          />
          <div className="proveedores-pro-actions">
            <button className="primary-btn proveedores-pro-primary-btn" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? (editingId ? 'Actualizando...' : 'Guardando...') : (editingId ? 'Actualizar proveedor' : 'Guardar proveedor')}
            </button>
            {editingId && (
              <button className="secondary-btn proveedores-pro-secondary-btn" type="button" onClick={() => { setError(''); setSuccess(''); resetFormState() }} disabled={saving}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </article>

      {onNavigate && (
        <button
          className="secondary-btn"
          type="button"
          onClick={() => onNavigate('pagosProveedor')}
          style={{ borderRadius: '14px', padding: '14px 16px', border: '1px solid #c9d6e3', background: '#f7fafc', fontWeight: 700, color: '#133b5c', textAlign: 'left' }}
        >
          Pagos a proveedor / Caja {empresaNombre} →
        </button>
      )}

      <article className="proveedores-pro-search-card">
        <div className="proveedores-pro-search-header">
          <div>
            <strong className="proveedores-pro-search-title">Buscar proveedor</strong>
            <span className="proveedores-pro-search-subtitle">{filtered.length} resultados visibles</span>
          </div>
        </div>

        <input
          className="input proveedores-pro-search-input"
          placeholder="Buscar por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </article>

      {loading && <article className="list-card">Cargando proveedores...</article>}
      {!loading && filtered.length === 0 && <article className="list-card">No hay proveedores para mostrar.</article>}

      {!loading && filtered.map((proveedor) => (
        <article className="proveedores-pro-card" key={proveedor.id}>
          <div className="proveedores-pro-top">
            <strong className="proveedores-pro-name">{proveedor.nombre}</strong>
            <span className={`proveedores-pro-status ${proveedor.activo ? 'is-active' : 'is-inactive'}`}>
              {proveedor.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', color: '#5b7083' }}>Le debés</span>
            <strong
              style={{
                fontSize: '20px',
                color: Number(saldoPorProveedor.get(String(proveedor.id)) || 0) > 0 ? '#b42318' : '#0f2233',
              }}
            >
              {formatMoney(saldoPorProveedor.get(String(proveedor.id)) || 0)}
            </strong>
          </div>

          <div className="proveedores-pro-footer" style={{ display: 'flex', gap: '8px' }}>
            <button className="proveedores-pro-edit-btn" type="button" onClick={() => { setDetalleId(proveedor.id); window.scrollTo({ top: 0 }) }}>
              Ver cuenta
            </button>
            <button className="proveedores-pro-edit-btn" type="button" onClick={() => handleEdit(proveedor)}>
              Editar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
