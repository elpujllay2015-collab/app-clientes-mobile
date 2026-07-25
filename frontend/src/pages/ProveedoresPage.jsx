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

export default function ProveedoresPage({ onNavigate }) {
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
          Pagos a proveedor / Mi caja →
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

          <div className="proveedores-pro-footer">
            <button className="proveedores-pro-edit-btn" type="button" onClick={() => handleEdit(proveedor)}>
              Editar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
