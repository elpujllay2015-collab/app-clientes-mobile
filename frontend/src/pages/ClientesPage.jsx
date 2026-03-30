import { useEffect, useMemo, useState } from 'react'
import { createCliente, fetchClientes, updateCliente } from '../api/clientesApi'

function formatMoney(value) {
  const number = Number(value || 0)
  return `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const emptyForm = {
  nombre: '',
  cuit: '',
  telefono: '',
  direccion: '',
  observaciones: '',
  saldo_inicial: '',
}

function normalizeSaldoInput(value) {
  return String(value ?? '').replace('.', ',')
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)

  async function loadClientes() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchClientes()
      setClientes(data)
    } catch (err) {
      setError('No se pudieron cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((cliente) =>
      [cliente.nombre, cliente.cuit, cliente.telefono, cliente.direccion].join(' ').toLowerCase().includes(q)
    )
  }, [clientes, query])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetFormState() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleEdit(cliente) {
    setError('')
    setSuccess('')
    setEditingId(cliente.id)
    setForm({
      nombre: cliente.nombre || '',
      cuit: cliente.cuit || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      observaciones: cliente.observaciones || '',
      saldo_inicial: normalizeSaldoInput(cliente.saldo_inicial),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setError('')
    setSuccess('')
    resetFormState()
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

    const payload = {
      nombre: form.nombre.trim(),
      cuit: form.cuit.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      observaciones: form.observaciones.trim(),
      saldo_inicial: saldoInicial ? Number(saldoInicial.replace(',', '.')).toFixed(2) : '0.00',
      activo: true,
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateCliente(editingId, payload)
        setSuccess('Cliente actualizado correctamente')
      } else {
        await createCliente(payload)
        setSuccess('Cliente creado correctamente')
      }
      resetFormState()
      await loadClientes()
    } catch (err) {
      setError(err.message || (editingId ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack clientes-pro-page">
      {error && <article className="list-card error-card">{error}</article>}
      {success && <article className="list-card success-card">{success}</article>}

      <article className="list-card clientes-pro-form-card">
        <div className="clientes-pro-card-header">
          <div>
            <span className="clientes-pro-kicker">{editingId ? 'Edición rápida' : 'Gestión de clientes'}</span>
            <strong className="clientes-pro-title">{editingId ? 'Editar cliente' : 'Alta de cliente'}</strong>
            <span className="clientes-pro-subtitle">
              {editingId ? 'Actualizá los datos y guardá los cambios.' : 'Cargá un cliente nuevo con sus datos y saldo inicial.'}
            </span>
          </div>
          {editingId && <span className="clientes-pro-inline-badge">Modo edición</span>}
        </div>

        <div className="form-grid clientes-pro-form-grid">
          <input className="input" placeholder="Nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} />
          <input className="input" placeholder="CUIT" value={form.cuit} onChange={(e) => updateField('cuit', e.target.value)} />
          <input className="input" placeholder="Teléfono" value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} />
          <input className="input" placeholder="Dirección" value={form.direccion} onChange={(e) => updateField('direccion', e.target.value)} />
          <input className="input" placeholder="Saldo inicial anterior" value={form.saldo_inicial} onChange={(e) => updateField('saldo_inicial', e.target.value)} />
          <textarea className="input clientes-pro-textarea" placeholder="Observaciones" value={form.observaciones} onChange={(e) => updateField('observaciones', e.target.value)} />
          <div className="actions-row clientes-pro-actions">
            <button className="primary-btn clientes-pro-primary-btn" type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? (editingId ? 'Actualizando...' : 'Guardando...') : (editingId ? 'Actualizar cliente' : 'Guardar cliente')}
            </button>
            {editingId && (
              <button className="secondary-btn clientes-pro-secondary-btn" type="button" onClick={handleCancelEdit} disabled={saving}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      </article>

      <article className="list-card clientes-pro-search-card">
        <div className="clientes-pro-search-header">
          <div>
            <strong className="clientes-pro-search-title">Buscar cliente</strong>
            <span className="clientes-pro-search-subtitle">
              {loading ? 'Cargando listado...' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'} visibles`}
            </span>
          </div>
        </div>
        <input className="input clientes-pro-search-input" placeholder="Buscar por nombre, CUIT, teléfono o dirección..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </article>

      {loading && <article className="list-card">Cargando clientes...</article>}
      {!loading && filtered.length === 0 && <article className="list-card">No hay clientes para mostrar.</article>}

      {!loading && filtered.map((cliente) => (
        <article className="list-card clientes-pro-client-card" key={cliente.id}>
          <div className="clientes-pro-client-top">
            <div className="clientes-pro-client-main">
              <strong className="clientes-pro-client-name">{cliente.nombre}</strong>
              <div className="clientes-pro-meta-row">
                <span className="clientes-pro-meta-pill">CUIT: {cliente.cuit || '-'}</span>
                <span className="clientes-pro-meta-pill">Tel: {cliente.telefono || '-'}</span>
              </div>
              <span className="clientes-pro-address">Dirección: {cliente.direccion || '-'}</span>
            </div>

            <span className={`clientes-pro-status-badge ${cliente.activo ? 'is-active' : 'is-inactive'}`}>
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {cliente.observaciones ? (
            <div className="clientes-pro-note-box">
              <span className="clientes-pro-note-label">Observaciones</span>
              <span className="clientes-pro-note-text">{cliente.observaciones}</span>
            </div>
          ) : null}

          <div className="clientes-pro-client-footer">
            <div className="clientes-pro-balance-box">
              <span className="clientes-pro-balance-label">Saldo inicial</span>
              <strong className="clientes-pro-balance-value">{formatMoney(cliente.saldo_inicial)}</strong>
            </div>

            <button className="secondary-btn clientes-pro-edit-btn" type="button" onClick={() => handleEdit(cliente)}>
              Editar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
