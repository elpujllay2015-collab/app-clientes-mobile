// Utilidades de fecha para la app.
//
// IMPORTANTE: `new Date().toISOString()` siempre devuelve la fecha/hora en UTC.
// Como Argentina está en UTC-3, si se usa para calcular "hoy", cualquier venta o
// pago cargado después de las 21:00 hora local queda con la fecha del día
// siguiente. Estas funciones calculan la fecha según la hora LOCAL del dispositivo.

// Devuelve la fecha de hoy (hora local) en formato ISO 'YYYY-MM-DD'.
export function hoyISOLocal() {
  const now = new Date()
  const offset = now.getTimezoneOffset() // minutos de diferencia respecto a UTC
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}
