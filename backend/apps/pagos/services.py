from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from apps.clientes.models import Cliente
from apps.pagos.models import Pago
from apps.ventas.models import Venta


DECIMAL_2 = Decimal("0.01")


def _to_decimal(value):
    return Decimal(str(value)).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)


def _recalcular_totales_venta(venta):
    montos = venta.pagos.filter(activo=True).values_list("monto", flat=True)

    acumulado = Decimal("0.00")
    for monto in montos:
        acumulado += Decimal(str(monto))

    acumulado = acumulado.quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
    saldo = (Decimal(str(venta.total_venta)) - acumulado).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)

    if saldo <= Decimal("0.00"):
        saldo = Decimal("0.00")
        estado = "PAGADO"
    elif acumulado > Decimal("0.00"):
        estado = "PARCIAL"
    else:
        estado = "PENDIENTE"

    venta.total_pagado = acumulado
    venta.saldo_pendiente = saldo
    venta.estado = estado
    venta.save(update_fields=["total_pagado", "saldo_pendiente", "estado", "updated_at"])

    return venta


@transaction.atomic
def registrar_pago_venta(*, fecha_pago, cliente_id, venta_id, monto, forma_pago, observaciones=""):
    cliente = Cliente.objects.get(id=cliente_id, activo=True)
    venta = Venta.objects.select_for_update().get(id=venta_id, activa=True)

    if venta.cliente_id != cliente.id:
        raise ValueError("El cliente del pago no coincide con el cliente de la venta.")

    monto = _to_decimal(monto)
    if monto <= 0:
        raise ValueError("El monto del pago debe ser mayor a 0.")

    saldo_actual = Decimal(str(venta.saldo_pendiente)).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
    if monto > saldo_actual:
        raise ValueError("El monto del pago no puede superar el saldo pendiente.")

    pago = Pago.objects.create(
        fecha_pago=fecha_pago,
        cliente=cliente,
        venta=venta,
        monto=monto,
        forma_pago=forma_pago,
        observaciones=observaciones or "",
        activo=True,
    )

    venta = _recalcular_totales_venta(venta)
    return pago, venta
