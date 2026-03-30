import { useEffect, useMemo, useState } from 'react'
import { fetchClientes } from '../api/clientesApi'
import { fetchProductos } from '../api/productosApi'
import { createVenta } from '../api/ventasApi'
import { fetchProveedores } from '../api/proveedoresApi'

function formatMoney(value) {
  const number = Number(value || 0)
  return `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toNumber(value) {
  const parsed = Number(String(value || '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function newItem() {
  return {
    producto_id: '',
    cantidad: '',
    costo_unitario: '',
    precio_unitario: '',
    observaciones: '',
  }
}

export default function NuevaVentaPage() {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [numeroFactura, setNumeroFactura] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [items, setItems] = useState([newItem()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [clientesData, productosData, proveedoresData] = await Promise.all([
          fetchClientes(),
          fetchProductos(),
          fetchProveedores(),
        ])
        if (mounted) {
          setClientes(clientesData)
          setProductos(productosData)
          setProveedores(proveedoresData)
        }
      } catch (err) {
        if (mounted) {
          setError('No se pudieron cargar clientes y productos')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      return { ...item, [field]: value }
    }))
  }

  function handleProductoChange(index, productoId) {
    const producto = productos.find((p) => String(p.id) === String(productoId))
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      return {
        ...item,
        producto_id: productoId,
        costo_unitario: producto ? producto.costo : '',
        precio_unitario: producto ? producto.precio_venta : '',
      }
    }))
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()])
  }

  function removeItem(index) {
    setItems((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))
  }

  const totals = useMemo(() => {
    let totalCosto = 0
    let totalVenta = 0
    let totalResultado = 0

    const byItem = items.map((item) => {
      const cantidad = toNumber(item.cantidad)
      const costo = toNumber(item.costo_unitario)
      const precio = toNumber(item.precio_unitario)
      const itemCosto = cantidad * costo
      const itemVenta = cantidad * precio
      const itemResultado = itemVenta - itemCosto
      totalCosto += itemCosto
      totalVenta += itemVenta
      totalResultado += itemResultado
      return { itemCosto, itemVenta, itemResultado }
    })

    return { totalCosto, totalVenta, totalResultado, byItem }
  }, [items])

  async function handleSubmit() {
    setError('')
    setSuccess('')

    if (!clienteId) {
      setError('Tenés que seleccionar un cliente')
      return
    }

    if (!proveedorId) {
      setError('Tenés que seleccionar un proveedor')
      return
    }

    if (numeroFactura && !/^\d{8}$/.test(numeroFactura)) {
      setError('El número de factura debe tener exactamente 8 dígitos')
      return
    }

    const cleanItems = items
      .filter((item) => item.producto_id && toNumber(item.cantidad) > 0)
      .map((item) => ({
        producto_id: Number(item.producto_id),
        cantidad: Number(toNumber(item.cantidad)).toFixed(2),
        costo_unitario: Number(toNumber(item.costo_unitario)).toFixed(2),
        precio_unitario: Number(toNumber(item.precio_unitario)).toFixed(2),
        observaciones: item.observaciones || '',
      }))

    if (cleanItems.length === 0) {
      setError('Tenés que cargar al menos un item válido')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fecha_compra: new Date().toISOString().slice(0, 10),
        cliente_id: Number(clienteId),
        proveedor_id: Number(proveedorId),
        numero_factura: numeroFactura.trim(),
        observaciones,
        items: cleanItems,
      }
      const venta = await createVenta(payload)
      setSuccess(`Venta #${venta.id} guardada correctamente`)
      setNumeroFactura('')
      setObservaciones('')
      setItems([newItem()])
    } catch (err) {
      setError(err.message || 'No se pudo guardar la venta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack ventas-pro-page">
      {loading && <article className="list-card">Cargando datos...</article>}
      {error && <article className="list-card error-card">{error}</article>}
      {success && <article className="list-card success-card">{success}</article>}

      {!loading && (
        <>
          <article className="list-card ventas-pro-card">
            <div className="ventas-pro-card-header">
              <div>
                <span className="ventas-pro-kicker">Ventas</span>
                <strong className="ventas-pro-title">Nueva venta</strong>
                <span className="ventas-pro-subtitle">Seleccioná cliente, cargá factura y sumá los productos de la operación.</span>
              </div>
            </div>

            <div className="ventas-pro-grid">
              <div className="ventas-pro-field ventas-pro-field-full">
                <span className="ventas-pro-field-label">Cliente</span>
                <select className="input ventas-pro-input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ventas-pro-field ventas-pro-field-full">
                <span className="ventas-pro-field-label">Proveedor</span>
                <select
                  className="input ventas-pro-input"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ventas-pro-field">
                <span className="ventas-pro-field-label">Número de factura</span>
                <input
                  className="input ventas-pro-input"
                  placeholder="Número de factura (8 dígitos)"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
              </div>

              <div className="ventas-pro-field ventas-pro-field-full">
                <span className="ventas-pro-field-label">Observaciones generales</span>
                <textarea
                  className="input ventas-pro-textarea"
                  placeholder="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>
          </article>

          <article className="list-card ventas-pro-card">
            <div className="ventas-pro-items-header">
              <div>
                <strong className="ventas-pro-section-title">Productos de la venta</strong>
                <span className="ventas-pro-subtitle">Cargá cantidades y valores de cada item antes de guardar.</span>
              </div>

              <button className="secondary-btn ventas-pro-add-btn" type="button" onClick={addItem}>
                Agregar otro item
              </button>
            </div>

            <div className="ventas-pro-items-stack">
              {items.map((item, index) => (
                <article className="list-card ventas-pro-item-card" key={index}>
                  <div className="ventas-pro-item-header">
                    <div>
                      <span className="ventas-pro-item-kicker">Item {index + 1}</span>
                      <strong className="ventas-pro-item-title">Detalle del producto</strong>
                    </div>

                    {items.length > 1 && (
                      <button className="secondary-btn ventas-pro-remove-btn" type="button" onClick={() => removeItem(index)}>
                        Quitar
                      </button>
                    )}
                  </div>

                  <div className="ventas-pro-grid">
                    <div className="ventas-pro-field ventas-pro-field-full">
                      <span className="ventas-pro-field-label">Producto</span>
                      <select
                        className="input ventas-pro-input"
                        value={item.producto_id}
                        onChange={(e) => handleProductoChange(index, e.target.value)}
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map((producto) => (
                          <option key={producto.id} value={producto.id}>
                            {producto.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ventas-pro-field">
                      <span className="ventas-pro-field-label">Cantidad</span>
                      <input
                        className="input ventas-pro-input"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                      />
                    </div>

                    <div className="ventas-pro-field">
                      <span className="ventas-pro-field-label">Costo unitario</span>
                      <input
                        className="input ventas-pro-input"
                        placeholder="Costo unitario"
                        value={item.costo_unitario}
                        onChange={(e) => updateItem(index, 'costo_unitario', e.target.value)}
                      />
                    </div>

                    <div className="ventas-pro-field">
                      <span className="ventas-pro-field-label">Precio unitario</span>
                      <input
                        className="input ventas-pro-input"
                        placeholder="Precio unitario"
                        value={item.precio_unitario}
                        onChange={(e) => updateItem(index, 'precio_unitario', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ventas-pro-item-totals">
                    <div className="ventas-pro-total-box">
                      <span className="ventas-pro-total-label">Total costo</span>
                      <strong>{formatMoney(totals.byItem[index]?.itemCosto || 0)}</strong>
                    </div>
                    <div className="ventas-pro-total-box">
                      <span className="ventas-pro-total-label">Total venta</span>
                      <strong>{formatMoney(totals.byItem[index]?.itemVenta || 0)}</strong>
                    </div>
                    <div className="ventas-pro-total-box ventas-pro-total-box-highlight">
                      <span className="ventas-pro-total-label">Resultado</span>
                      <strong>{formatMoney(totals.byItem[index]?.itemResultado || 0)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="summary-card ventas-pro-summary-card">
            <div className="ventas-pro-summary-row">
              <div>
                <span className="summary-label">Total costo</span>
                <strong>{formatMoney(totals.totalCosto)}</strong>
              </div>
              <div>
                <span className="summary-label">Total venta</span>
                <strong>{formatMoney(totals.totalVenta)}</strong>
              </div>
              <div>
                <span className="summary-label">Res. Vta total</span>
                <strong>{formatMoney(totals.totalResultado)}</strong>
              </div>
            </div>
          </article>

          <button className="primary-btn ventas-pro-primary-btn" type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar venta'}
          </button>
        </>
      )}
    </div>
  )
}
