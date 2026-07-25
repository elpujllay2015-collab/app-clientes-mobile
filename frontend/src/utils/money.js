// Formateo de montos para toda la app: se muestran SIN centavos.
//
// Regla de redondeo (definida con el usuario): los centavos ya no se usan.
//   - de ,01 a ,50  -> redondea para ABAJO  ($ 1.000,50 -> $ 1.000)
//   - de ,51 a ,99  -> redondea para ARRIBA ($ 1.000,51 -> $ 1.001)
//
// OJO: esto es SOLO para mostrar. El dato guardado en la base conserva sus
// centavos; no se altera ningun calculo ni valor almacenado.

export function roundMoney(value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return 0
  const sign = n < 0 ? -1 : 1
  const cents = Math.round(Math.abs(n) * 100)
  // (cents + 49) hace que ,50 caiga para abajo y ,51 para arriba
  const pesos = Math.floor((cents + 49) / 100)
  return sign * pesos
}

export function formatMoney(value) {
  return `$ ${roundMoney(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
