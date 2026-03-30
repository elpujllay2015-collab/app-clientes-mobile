import { useEffect, useMemo, useState } from 'react'
import { createProducto, fetchProductos, updateProducto } from '../api/productosApi'

function formatMoney(value) {
  const number = Number(value || 0)
  return `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const emptyForm = { nombre: '', costo: '', precio_venta: '' }

function normalizeMoneyInput(value) {
  return String(value ?? '').replace('.', ',')
}

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)

  async function loadProductos() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProductos()
      setProductos(data)
    } catch (err) {
      setError('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProductos()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((producto) => String(producto.nombre || '').toLowerCase().includes(q))
  }, [productos, query])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetFormState() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleEdit(producto) {
    setError('')
    setSuccess('')
    setEditingId(producto.id)
    setForm({
      nombre: producto.nombre || '',
      costo: normalizeMoneyInput(producto.costo),
      precio_venta: normalizeMoneyInput(producto.precio_venta),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function parseMoneyField(label, value) {
    const raw = String(value || '').trim()
    if (!raw) return '0.00'
    const normalized = raw.replace(',', '.')
    if (Number.isNaN(Number(normalized))) {
      throw new Error(`${label} debe ser un número válido`)
    }
    return Number(normalized).toFixed(2)
  }

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    let payload
    try {
      payload = {
        nombre: form.nombre.trim(),
        costo: parseMoneyField('El costo', form.costo),
        precio_venta: parseMoneyField('El precio de venta', form.precio_venta),
        activo: true,
      }
    } catch (err) {
      setError(err.message)
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateProducto(editingId, payload)
        setSuccess('Producto actualizado correctamente')
      } else {
        await createProducto(payload)
        setSuccess('Producto creado correctamente')
      }
      resetFormState()
      await loadProductos()
    } catch (err) {
      setError(err.message || (editingId ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto'))
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setError('')
    setSuccess('')
    resetFormState()
  }

  return (
    <div className="stack productos-pro-page">
      {error && <article className="list-card error-card">{error}</article>}
      {success && <article className="list-card success-card">{success}</article>}

      <article className="list-card productos-pro-form-card">
        <div className="productos-pro-card-header">
          <div>
            <span className="productos-pro-kicker">{editingId ? 'Edición rápida' : 'Gestión de productos'}</span>
            <strong className="productos-pro-title">{editingId ? 'Editar producto' : 'Alta de producto'}</strong>
            <span className="productos-pro-subtitle">
              {editingId ? 'Actualizá costo y precio de venta sin salir de la pantalla.' : 'Cargá productos nuevos con sus precios para vender más rápido.'}
            </span>
          </div>
          {editingId && <span className="productos-pro-inline-badge">Modo edición</span>}
        </div>

        <div className="form-grid productos-pro-form-grid">
          <input className="input" placeholder="Nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} />
          <input className="input" placeholder="Costo" value={form.costo} onChange={(e) => updateField('costo', e.target.value)} />
          <input className="input" placeholder="Precio de venta" value={form.precio_venta} onChange={(e) => updateField('precio_venta', e.target.value)} />
          <div className="actions-row productos-pro-actions">
            <button className="primary-btn productos-pro-primary-btn" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? (editingId ? 'Actualizando...' : 'Guardando...') : (editingId ? 'Actualizar producto' : 'Guardar producto')}
            </button>
            {editingId && (
              <button className="secondary-btn productos-pro-secondary-btn" type="button" onClick={handleCancelEdit} disabled={saving}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </article>

      <article className="list-card productos-pro-search-card">
        <div className="productos-pro-search-header">
          <div>
            <strong className="productos-pro-search-title">Buscar producto</strong>
            <span className="productos-pro-search-subtitle">
              {loading ? 'Cargando listado...' : `${filtered.length} producto${filtered.length === 1 ? '' : 's'} visible${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
        <input className="input productos-pro-search-input" placeholder="Buscar por nombre del producto..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </article>

      {loading && <article className="list-card">Cargando productos...</article>}
      {!loading && filtered.length === 0 && <article className="list-card">No hay productos para mostrar.</article>}

      {!loading && filtered.map((producto) => (
        <article className="list-card productos-pro-product-card" key={producto.id}>
          <div className="productos-pro-product-top">
            <div className="productos-pro-product-main">
              <strong className="productos-pro-product-name">{producto.nombre}</strong>
              <span className="productos-pro-product-caption">Valores comerciales actuales</span>
            </div>

            <span className={`productos-pro-status-badge ${producto.activo ? 'is-active' : 'is-inactive'}`}>
              {producto.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="productos-pro-price-grid">
            <div className="productos-pro-price-box">
              <span className="productos-pro-price-label">Costo</span>
              <strong className="productos-pro-price-value">{formatMoney(producto.costo)}</strong>
            </div>

            <div className="productos-pro-price-box productos-pro-price-box-sale">
              <span className="productos-pro-price-label">Precio de venta</span>
              <strong className="productos-pro-price-value">{formatMoney(producto.precio_venta)}</strong>
            </div>
          </div>

          <div className="productos-pro-product-footer">
            <button className="secondary-btn productos-pro-edit-btn" type="button" onClick={() => handleEdit(producto)}>
              Editar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
