from django.db import models

from common.models import TimeStampedModel
from apps.clientes.models import Cliente
from apps.productos.models import Producto


class Proveedor(TimeStampedModel):
    nombre = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'ventas_proveedor'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Venta(TimeStampedModel):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PARCIAL', 'Parcial'),
        ('PAGADO', 'Pagado'),
    ]

    fecha_compra = models.DateField()  # <-- LÍNEA INSERTADA

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='ventas')

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='ventas',
        null=True,
        blank=True
    )  # <-- LÍNEA INSERTADA

    cliente_nombre_snapshot = models.CharField(max_length=150)  # <-- LÍNEA INSERTADA
    cuit_snapshot = models.CharField(max_length=20, blank=True, default='')  # <-- LÍNEA INSERTADA
    numero_factura = models.CharField(max_length=8, blank=True, default='', db_index=True)  # <-- LÍNEA INSERTADA

    total_costo = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    total_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    resultado_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA

    total_pagado = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA

    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='PENDIENTE')  # <-- LÍNEA INSERTADA

    observaciones = models.TextField(blank=True, default='')  # <-- LÍNEA INSERTADA

    activa = models.BooleanField(default=True)  # <-- LÍNEA INSERTADA

    class Meta:
        db_table = 'ventas_venta'  # <-- LÍNEA INSERTADA
        ordering = ['-fecha_compra', '-id']  # <-- LÍNEA INSERTADA

    def __str__(self):
        return f"Venta #{self.id} - {self.cliente_nombre_snapshot}"  # <-- LÍNEA INSERTADA


class VentaItem(TimeStampedModel):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='items')  # <-- LÍNEA INSERTADA

    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)  # <-- LÍNEA INSERTADA

    producto_nombre_snapshot = models.CharField(max_length=150)  # <-- LÍNEA INSERTADA

    cantidad = models.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA

    costo_unitario = models.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA

    total_costo = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    total_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    resultado_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA

    observaciones = models.TextField(blank=True, default='')  # <-- LÍNEA INSERTADA

    class Meta:
        db_table = 'ventas_venta_item'  # <-- LÍNEA INSERTADA
        ordering = ['id']  # <-- LÍNEA INSERTADA

    def __str__(self):
        return f"{self.producto_nombre_snapshot} x {self.cantidad}"  # <-- LÍNEA INSERTADA