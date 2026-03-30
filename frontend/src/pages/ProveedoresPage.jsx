import { useEffect, useMemo, useState } from 'react'
import { createProveedor, fetchProveedores, updateProveedor } from '../api/proveedoresApi'

const emptyForm = {
  nombre: '',
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([])
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
      const data = await fetchProveedores()
      setProveedores(data)
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

  function resetFormState() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleEdit(proveedor) {
    setError('')
    setSuccess('')
    setEditingId(proveedor.id)
    setForm({ nombre: proveedor.nombre || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setError('')
    setSuccess('')

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
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
            onChange={(e) => setForm({ nombre: e.target.value })}
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
