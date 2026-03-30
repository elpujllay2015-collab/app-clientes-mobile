import { useEffect, useMemo, useState } from 'react'
import { fetchClientes } from '../api/clientesApi'
import { fetchVentas } from '../api/ventasApi'
import { fetchPagos } from '../api/pagosApi'

const PAGE_SIZE = 10

function formatMoney(value) {
  const number = Number(value || 0)
  return `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function getSaldoToneClass(value) {
  const saldo = Number(value || 0)
  if (saldo > 0) return 'danger'
  if (saldo < 0) return 'success'
  return 'neutral'
}

function parseDateOnly(value) {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function getDaysFromToday(value) {
  const parsedDate = parseDateOnly(value)
  if (!parsedDate) return null
  const today = new Date()
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffMs = currentDate.getTime() - parsedDate.getTime()
  if (diffMs < 0) return 0
  return Math.floor(diffMs / 86400000)
}

function getDebtSignalConfig(summary) {
  if (!summary || !summary.hasDebt) {
    return {
      dotColor: '#c9d6e3',
      bgColor: '#f4f7fb',
      label: 'Sin deuda',
      helper: 'Cuenta al día',
    }
  }

  if (summary.hasSaldoInicialDebt) {
    return {
      dotColor: '#d92d20',
      bgColor: '#fff1f3',
      label: 'Rojo',
      helper: 'Saldo anterior pendiente',
    }
  }

  if (summary.oldestDebtDays <= 7) {
    return {
      dotColor: '#12b76a',
      bgColor: '#ecfdf3',
      label: 'Verde',
      helper: `${summary.oldestDebtDays} día${summary.oldestDebtDays === 1 ? '' : 's'} de antigüedad`,
    }
  }

  if (summary.oldestDebtDays <= 15) {
    return {
      dotColor: '#f79009',
      bgColor: '#fff7ed',
      label: 'Amarillo',
      helper: `${summary.oldestDebtDays} días de antigüedad`,
    }
  }

  return {
    dotColor: '#d92d20',
    bgColor: '#fff1f3',
    label: 'Rojo',
    helper: `${summary.oldestDebtDays} días de antigüedad`,
  }
}

export default function CuentaCorrientePage() {
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [pagos, setPagos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [clientesData, ventasData, pagosData] = await Promise.all([
          fetchClientes(),
          fetchVentas(),
          fetchPagos(),
        ])
        if (mounted) {
          setClientes(clientesData)
          setVentas(ventasData)
          setPagos(pagosData)
        }
      } catch (err) {
        if (mounted) {
          setError('No se pudo cargar la cuenta corriente')
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

  const clientesOrdenados = useMemo(() => {
    return [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  }, [clientes])

  const saldoPorCliente = useMemo(() => {
    const saldoMap = new Map()

    clientes.forEach((cliente) => {
      saldoMap.set(String(cliente.id), Number(cliente.saldo_inicial || 0))
    })

    ventas.forEach((venta) => {
      const ventaClienteId = venta.cliente != null ? String(venta.cliente) : ''
      if (ventaClienteId && saldoMap.has(ventaClienteId)) {
        saldoMap.set(ventaClienteId, Number(saldoMap.get(ventaClienteId) || 0) + Number(venta.saldo_pendiente || 0))
        return
      }

      const nombreVenta = normalizeText(venta.cliente_nombre_snapshot)
      if (!nombreVenta) return

      const clientePorNombre = clientes.find((cliente) => normalizeText(cliente.nombre) === nombreVenta)
      if (!clientePorNombre) return

      const key = String(clientePorNombre.id)
      saldoMap.set(key, Number(saldoMap.get(key) || 0) + Number(venta.saldo_pendiente || 0))
    })

    return saldoMap
  }, [clientes, ventas])

  const deudaMasAntiguaPorCliente = useMemo(() => {
    const debtMap = new Map()

    clientes.forEach((cliente) => {
      const saldoInicial = Number(cliente.saldo_inicial || 0)
      debtMap.set(String(cliente.id), {
        hasDebt: saldoInicial > 0,
        hasSaldoInicialDebt: saldoInicial > 0,
        oldestDebtDays: saldoInicial > 0 ? 9999 : null,
        oldestDebtDate: saldoInicial > 0 ? 'Saldo anterior' : null,
      })
    })

    ventas.forEach((venta) => {
      if (Number(venta.saldo_pendiente || 0) <= 0) return

      let clienteKey = venta.cliente != null ? String(venta.cliente) : ''
      if (!clienteKey) {
        const nombreVenta = normalizeText(venta.cliente_nombre_snapshot)
        if (!nombreVenta) return
        const clientePorNombre = clientes.find((cliente) => normalizeText(cliente.nombre) === nombreVenta)
        if (!clientePorNombre) return
        clienteKey = String(clientePorNombre.id)
      }

      if (!clienteKey) return

      const currentSummary = debtMap.get(clienteKey) || {
        hasDebt: false,
        hasSaldoInicialDebt: false,
        oldestDebtDays: null,
        oldestDebtDate: null,
      }
      const debtDays = getDaysFromToday(venta.fecha_compra)
      if (debtDays == null) return

      const nextSummary = {
        ...currentSummary,
        hasDebt: true,
      }

      if (nextSummary.oldestDebtDays == null || debtDays > nextSummary.oldestDebtDays) {
        nextSummary.oldestDebtDays = debtDays
        nextSummary.oldestDebtDate = venta.fecha_compra
      }

      debtMap.set(clienteKey, nextSummary)
    })

    return debtMap
  }, [clientes, ventas])

  const clientesConSaldo = useMemo(() => {
    return clientesOrdenados.map((cliente) => ({
      ...cliente,
      saldo_actual: Number(saldoPorCliente.get(String(cliente.id)) || 0),
      deuda_mas_antigua: deudaMasAntiguaPorCliente.get(String(cliente.id)) || {
        hasDebt: false,
        hasSaldoInicialDebt: false,
        oldestDebtDays: null,
        oldestDebtDate: null,
      },
    }))
  }, [clientesOrdenados, saldoPorCliente, deudaMasAntiguaPorCliente])

  const totalPages = Math.max(1, Math.ceil(clientesConSaldo.length / PAGE_SIZE))

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages))
  }, [totalPages])

  const clientesPaginados = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return clientesConSaldo.slice(start, start + PAGE_SIZE)
  }, [clientesConSaldo, page])

  const saldoTotalGeneral = useMemo(() => {
    return clientesConSaldo.reduce((acc, cliente) => acc + Number(cliente.saldo_actual || 0), 0)
  }, [clientesConSaldo])

  const clientesConDeuda = useMemo(() => {
    return clientesConSaldo.filter((cliente) => Number(cliente.saldo_actual || 0) > 0).length
  }, [clientesConSaldo])

  const clienteSeleccionado = useMemo(
    () => clientes.find((cliente) => String(cliente.id) === String(clienteId)),
    [clientes, clienteId]
  )

  const ventasCliente = useMemo(() => {
    if (!clienteSeleccionado) return []
    const clienteNombre = normalizeText(clienteSeleccionado.nombre)
    return ventas.filter((venta) => {
      if (String(venta.cliente || '') === String(clienteSeleccionado.id)) {
        return true
      }
      return normalizeText(venta.cliente_nombre_snapshot) === clienteNombre
    })
  }, [ventas, clienteSeleccionado])

  const pagosCliente = useMemo(() => {
    if (!clienteId) return []
    return pagos.filter((pago) => String(pago.cliente) === String(clienteId))
  }, [pagos, clienteId])

  const resumen = useMemo(() => {
    const totalVendido = ventasCliente.reduce((acc, venta) => acc + Number(venta.total_venta || 0), 0)
    const totalPagado = ventasCliente.reduce((acc, venta) => acc + Number(venta.total_pagado || 0), 0)
    const saldoVentas = ventasCliente.reduce((acc, venta) => acc + Number(venta.saldo_pendiente || 0), 0)
    const saldoInicial = Number(clienteSeleccionado?.saldo_inicial || 0)
    const saldoPendiente = saldoInicial + saldoVentas
    return { totalVendido, totalPagado, saldoInicial, saldoPendiente }
  }, [ventasCliente, clienteSeleccionado])

  const handleSelectCliente = (value) => {
    setClienteId(String(value || ''))
  }

  const handleOpenCliente = (id) => {
    setClienteId(String(id))
  }

  const handleVolverAlResumen = () => {
    setClienteId('')
  }

  const paginationNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }, [totalPages])

  const renderMetricCard = (label, value, helperText, tone = 'neutral') => (
    <article
      className="summary-card"
      style={{
        borderRadius: '18px',
        border: '1px solid #d7e1ea',
        padding: '14px',
        background:
          tone === 'danger'
            ? 'linear-gradient(180deg, #fff8f8 0%, #ffffff 100%)'
            : tone === 'success'
              ? 'linear-gradient(180deg, #f5fff8 0%, #ffffff 100%)'
              : 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
        display: 'grid',
        alignContent: 'start',
        gap: '8px',
        minHeight: '112px',
      }}
    >
      <span className="summary-label" style={{ fontSize: '12px', color: '#5b7083' }}>
        {label}
      </span>
      <strong
        style={{
          fontSize: '18px',
          lineHeight: 1.2,
          color: '#0f2233',
          display: 'block',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </strong>
      {helperText && (
        <span
          style={{
            color: '#5b7083',
            fontSize: '12px',
            lineHeight: 1.3,
            display: 'block',
          }}
        >
          {helperText}
        </span>
      )}
    </article>
  )

  const renderListadoGeneral = () => (
    <>
      <section
        className="summary-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}
      >
        {renderMetricCard('Saldo total pendiente', formatMoney(saldoTotalGeneral), 'Suma total de todas las cuentas', getSaldoToneClass(saldoTotalGeneral))}
        {renderMetricCard('Clientes con deuda', String(clientesConDeuda), `${clientesConSaldo.length} clientes registrados`, 'neutral')}
      </section>

      <article
        className="list-card section-title-card"
        style={{
          borderRadius: '18px',
          padding: '14px 16px',
          background: 'linear-gradient(180deg, #f9fbfd 0%, #ffffff 100%)',
          border: '1px solid #d7e1ea',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <strong style={{ fontSize: '24px', color: '#0f2233' }}>Clientes</strong>
        <span style={{ color: '#5b7083' }}>Orden alfabético · hasta {PAGE_SIZE} por página</span>
      </article>

      {clientesPaginados.length === 0 ? (
        <article
          className="list-card"
          style={{
            borderRadius: '18px',
            padding: '16px',
            border: '1px dashed #c7d4e2',
            background: '#fbfdff',
            color: '#5b7083',
          }}
        >
          No hay clientes cargados.
        </article>
      ) : (
        clientesPaginados.map((cliente) => {
          const toneClass = getSaldoToneClass(cliente.saldo_actual)
          const saldoColor = toneClass === 'danger' ? '#b42318' : toneClass === 'success' ? '#027a48' : '#0f2233'
          const badgeBg = toneClass === 'danger' ? '#fff1f3' : toneClass === 'success' ? '#ecfdf3' : '#eef4ff'
          const debtSignal = getDebtSignalConfig(cliente.deuda_mas_antigua)

          return (
            <article
              className="list-card"
              key={cliente.id}
              style={{
                borderRadius: '18px',
                padding: '14px',
                border: '1px solid #d7e1ea',
                background: '#ffffff',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#0f2233', marginBottom: '2px' }}>{cliente.nombre}</strong>
                </div>

                <div style={{ display: 'grid', gap: '4px', justifyItems: 'end' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: debtSignal.bgColor,
                      color: '#0f2233',
                      fontWeight: 700,
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '999px',
                        background: debtSignal.dotColor,
                        boxShadow: `0 0 0 4px ${debtSignal.bgColor}`,
                        flexShrink: 0,
                      }}
                    />
                    <span>{debtSignal.label}</span>
                  </div>
                  <span style={{ color: '#5b7083', fontSize: '11px', lineHeight: 1.25, textAlign: 'right', maxWidth: '110px' }}>{debtSignal.helper}</span>
                </div>

              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid #edf2f7',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ color: '#5b7083', fontSize: '12px' }}>Saldo actual</span>
                  <strong style={{ fontSize: '18px', color: saldoColor }}>{formatMoney(cliente.saldo_actual)}</strong>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 'fit-content',
                      padding: '5px 8px',
                      borderRadius: '999px',
                      background: badgeBg,
                      color: saldoColor,
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    {cliente.saldo_actual > 0 ? 'Debe' : cliente.saldo_actual < 0 ? 'A favor' : 'Sin deuda'}
                  </span>
                </div>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => handleOpenCliente(cliente.id)}
                  style={{
                    minWidth: '112px',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    border: '1px solid #c9d6e3',
                    background: '#f7fafc',
                    fontWeight: 700,
                    color: '#133b5c',
                  }}
                >
                  Ver cuenta
                </button>
              </div>
            </article>
          )
        })
      )}

      {totalPages > 1 && (
        <article
          className="list-card"
          style={{
            borderRadius: '18px',
            padding: '14px 16px',
            border: '1px solid #d7e1ea',
            background: '#ffffff',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
            <span style={{ color: '#5b7083', fontSize: '13px' }}>Página {page} de {totalPages}</span>
            <div className="actions-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                style={{ borderRadius: '10px', padding: '10px 12px' }}
              >
                Anterior
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages}
                style={{ borderRadius: '10px', padding: '10px 12px' }}
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {paginationNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                style={{
                  minWidth: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  border: pageNumber === page ? '1px solid #133b5c' : '1px solid #d7e1ea',
                  background: pageNumber === page ? '#133b5c' : '#ffffff',
                  color: pageNumber === page ? '#ffffff' : '#133b5c',
                  fontWeight: 700,
                }}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        </article>
      )}
    </>
  )

  const renderDetalleCliente = () => (
    <>
      <div className="actions-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          className="secondary-btn"
          type="button"
          onClick={handleVolverAlResumen}
          style={{
            borderRadius: '12px',
            padding: '12px 14px',
            border: '1px solid #c9d6e3',
            background: '#f7fafc',
            fontWeight: 700,
            color: '#133b5c',
          }}
        >
          Volver al resumen general
        </button>
      </div>

      <article
        className="summary-card"
        style={{
          borderRadius: '20px',
          padding: '18px',
          border: '1px solid #d7e1ea',
          background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
        }}
      >
        <span className="summary-label" style={{ fontSize: '12px', color: '#5b7083', marginBottom: '6px' }}>
          Cliente seleccionado
        </span>
        <strong style={{ fontSize: '24px', color: '#0f2233', marginBottom: '8px' }}>{clienteSeleccionado.nombre}</strong>
        <div style={{ display: 'grid', gap: '4px', color: '#5b7083', fontSize: '14px' }}>
          <span>CUIT: {clienteSeleccionado.cuit || '-'}</span>
          <span>Teléfono: {clienteSeleccionado.telefono || '-'}</span>
          <span>Dirección: {clienteSeleccionado.direccion || '-'}</span>
        </div>
      </article>

      <section
        className="summary-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}
      >
        {renderMetricCard('Total vendido', formatMoney(resumen.totalVendido), null, 'neutral')}
        {renderMetricCard('Total pagado', formatMoney(resumen.totalPagado), null, 'success')}
        {renderMetricCard('Saldo inicial', formatMoney(resumen.saldoInicial), null, 'neutral')}
        {renderMetricCard('Saldo pendiente', formatMoney(resumen.saldoPendiente), null, getSaldoToneClass(resumen.saldoPendiente))}
      </section>

      <article
        className="list-card section-title-card"
        style={{
          borderRadius: '18px',
          padding: '16px',
          background: 'linear-gradient(180deg, #f9fbfd 0%, #ffffff 100%)',
          border: '1px solid #d7e1ea',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <strong style={{ fontSize: '22px', color: '#0f2233' }}>Ventas del cliente</strong>
        <span style={{ color: '#5b7083' }}>{ventasCliente.length} registradas</span>
      </article>

      {ventasCliente.length === 0 && (
        <article
          className="list-card"
          style={{
            borderRadius: '18px',
            padding: '18px',
            border: '1px dashed #c7d4e2',
            background: '#fbfdff',
            color: '#5b7083',
          }}
        >
          Este cliente no tiene ventas registradas.
        </article>
      )}

      {ventasCliente.map((venta) => (
        <article
          className="list-card"
          key={venta.id}
          style={{
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid #d7e1ea',
            background: '#ffffff',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            display: 'grid',
            gap: '6px',
          }}
        >
          <strong style={{ fontSize: '18px', color: '#0f2233' }}>Venta #{venta.id}</strong>
          <span>Fecha: {venta.fecha_compra}</span>
          <span>Factura: {venta.numero_factura || '-'}</span>
          <span>Total venta: {formatMoney(venta.total_venta)}</span>
          <span>Total pagado: {formatMoney(venta.total_pagado)}</span>
          <span>Saldo pendiente: {formatMoney(venta.saldo_pendiente)}</span>
          <span>Estado: {venta.estado}</span>
          <span>Resultado venta: {formatMoney(venta.resultado_venta)}</span>
        </article>
      ))}

      <article
        className="list-card section-title-card"
        style={{
          borderRadius: '18px',
          padding: '16px',
          background: 'linear-gradient(180deg, #f9fbfd 0%, #ffffff 100%)',
          border: '1px solid #d7e1ea',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <strong style={{ fontSize: '22px', color: '#0f2233' }}>Pagos realizados</strong>
        <span style={{ color: '#5b7083' }}>{pagosCliente.length} registrados</span>
      </article>

      {pagosCliente.length === 0 && (
        <article
          className="list-card"
          style={{
            borderRadius: '18px',
            padding: '18px',
            border: '1px dashed #c7d4e2',
            background: '#fbfdff',
            color: '#5b7083',
          }}
        >
          Este cliente no tiene pagos registrados.
        </article>
      )}

      {pagosCliente.map((pago) => (
        <article
          className="list-card"
          key={pago.id}
          style={{
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid #d7e1ea',
            background: '#ffffff',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
            display: 'grid',
            gap: '6px',
          }}
        >
          <strong style={{ fontSize: '18px', color: '#0f2233' }}>Pago #{pago.id}</strong>
          <span>Fecha: {pago.fecha_pago}</span>
          <span>Monto: {formatMoney(pago.monto)}</span>
          <span>Método: {pago.forma_pago}</span>
          <span>Venta: #{pago.venta}</span>
          <span>Observaciones: {pago.observaciones || '-'}</span>
        </article>
      ))}
    </>
  )

  return (
    <div className="stack" style={{ gap: '14px' }}>
      {error && (
        <article
          className="list-card error-card"
          style={{
            borderRadius: '16px',
            padding: '14px 16px',
            border: '1px solid #f3b7bd',
            background: '#fff5f6',
            color: '#b42318',
          }}
        >
          {error}
        </article>
      )}

      <select
        className="input"
        value={clienteId}
        onChange={(e) => handleSelectCliente(e.target.value)}
        style={{
          height: '56px',
          borderRadius: '16px',
          border: '1px solid #c9d6e3',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
          fontWeight: 600,
        }}
      >
        <option value="">Seleccionar cliente</option>
        {clientesOrdenados.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nombre}
          </option>
        ))}
      </select>

      {loading && (
        <article
          className="list-card"
          style={{
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid #d7e1ea',
            background: '#ffffff',
            color: '#5b7083',
          }}
        >
          Cargando cuenta corriente...
        </article>
      )}

      {!loading && !clienteSeleccionado && renderListadoGeneral()}
      {!loading && clienteSeleccionado && renderDetalleCliente()}
    </div>
  )
}
