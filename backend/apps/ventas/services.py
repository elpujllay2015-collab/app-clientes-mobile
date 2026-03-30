from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from apps.clientes.models import Cliente
from apps.productos.models import Producto
from apps.ventas.models import Proveedor, Venta, VentaItem


DECIMAL_2 = Decimal("0.01")


def _to_decimal(value):
    return Decimal(str(value)).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)


@transaction.atomic
def crear_venta_con_items(*, fecha_compra, cliente_id, proveedor_id, items, numero_factura="", observaciones=""):
    if not items:
        raise ValueError("La venta debe tener al menos un item.")

    cliente = Cliente.objects.get(id=cliente_id, activo=True)
    proveedor = Proveedor.objects.get(id=proveedor_id, activo=True)

    venta = Venta.objects.create(
        proveedor=proveedor,
        fecha_compra=fecha_compra,
        cliente=cliente,
        cliente_nombre_snapshot=cliente.nombre,
        cuit_snapshot=cliente.cuit or "",
        numero_factura=(numero_factura or "").strip(),
        total_costo=Decimal("0.00"),
        total_venta=Decimal("0.00"),
        resultado_venta=Decimal("0.00"),
        total_pagado=Decimal("0.00"),
        saldo_pendiente=Decimal("0.00"),
        estado="PENDIENTE",
        observaciones=observaciones or "",
        activa=True,
    )

    total_costo = Decimal("0.00")
    total_venta = Decimal("0.00")

    for item in items:
        producto = Producto.objects.get(id=item["producto_id"], activo=True)

        cantidad = _to_decimal(item["cantidad"])
        costo_unitario = _to_decimal(item["costo_unitario"])
        precio_unitario = _to_decimal(item["precio_unitario"])

        if cantidad <= 0:
            raise ValueError("La cantidad debe ser mayor a 0.")
        if costo_unitario < 0:
            raise ValueError("El costo unitario no puede ser negativo.")
        if precio_unitario < 0:
            raise ValueError("El precio unitario no puede ser negativo.")

        item_total_costo = (cantidad * costo_unitario).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
        item_total_venta = (cantidad * precio_unitario).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
        item_resultado = (item_total_venta - item_total_costo).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)

        VentaItem.objects.create(
            venta=venta,
            producto=producto,
            producto_nombre_snapshot=producto.nombre,
            cantidad=cantidad,
            costo_unitario=costo_unitario,
            precio_unitario=precio_unitario,
            total_costo=item_total_costo,
            total_venta=item_total_venta,
            resultado_venta=item_resultado,
            observaciones=item.get("observaciones", "") or "",
        )

        total_costo += item_total_costo
        total_venta += item_total_venta

    total_costo = total_costo.quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
    total_venta = total_venta.quantize(DECIMAL_2, rounding=ROUND_HALF_UP)
    resultado_venta = (total_venta - total_costo).quantize(DECIMAL_2, rounding=ROUND_HALF_UP)

    venta.total_costo = total_costo
    venta.total_venta = total_venta
    venta.resultado_venta = resultado_venta
    venta.total_pagado = Decimal("0.00")
    venta.saldo_pendiente = total_venta
    venta.estado = "PENDIENTE"
    venta.save(
        update_fields=[
            "total_costo",
            "total_venta",
            "resultado_venta",
            "total_pagado",
            "saldo_pendiente",
            "estado",
            "updated_at",
        ]
    )

    return venta
