from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum

from apps.clientes.models import Cliente
from apps.pagos.models import Pago
from apps.ventas.models import Venta


DECIMAL_2 = Decimal("0.01")


def saldo_inicial_pendiente(cliente):
    """Saldo inicial del cliente menos lo ya cobrado a cuenta inicial (pagos sin venta)."""
    pagado = cliente.pagos.filter(activo=True, venta__isnull=True).aggregate(s=Sum("monto"))["s"] or Decimal("0")
    pendiente = (Decimal(str(cliente.saldo_inicial)) - Decimal(str(pagado))).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
    return pendiente if pendiente > 0 else Decimal("0.00")


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
def registrar_pago_venta(*, empresa, fecha_pago, cliente_id, venta_id, monto, forma_pago, observaciones=""):
    cliente = Cliente.objects.get(id=cliente_id, activo=True, empresa=empresa)
    venta = Venta.objects.select_for_update().get(id=venta_id, activa=True, empresa=empresa)

    if venta.cliente_id != cliente.id:
        raise ValueError("El cliente del pago no coincide con el cliente de la venta.")

    monto = _to_decimal(monto)
    if monto <= 0:
        raise ValueError("El monto del pago debe ser mayor a 0.")

    saldo_actual = Decimal(str(venta.saldo_pendiente)).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
    if monto > saldo_actual:
        raise ValueError("El monto del pago no puede superar el saldo pendiente.")

    pago = Pago.objects.create(
        empresa=empresa,
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


@transaction.atomic
def registrar_pago_cuenta_inicial(*, empresa, fecha_pago, cliente_id, monto, forma_pago, observaciones=""):
    """Registra un pago que baja el saldo inicial (deuda anterior) del cliente, sin venta asociada."""
    cliente = Cliente.objects.select_for_update().get(id=cliente_id, activo=True, empresa=empresa)

    monto = _to_decimal(monto)
    if monto <= 0:
        raise ValueError("El monto del pago debe ser mayor a 0.")

    pendiente = saldo_inicial_pendiente(cliente)
    if pendiente <= 0:
        raise ValueError("Este cliente no tiene saldo inicial pendiente para cobrar.")
    if monto > pendiente:
        raise ValueError("El monto no puede superar el saldo inicial pendiente.")

    pago = Pago.objects.create(
        empresa=empresa,
        fecha_pago=fecha_pago,
        cliente=cliente,
        venta=None,
        monto=monto,
        forma_pago=forma_pago,
        observaciones=observaciones or "",
        activo=True,
    )

    return pago
