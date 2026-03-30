from django.contrib import admin

from apps.ventas.models import Venta, VentaItem


class VentaItemInline(admin.TabularInline):
    model = VentaItem  # <-- LÍNEA INSERTADA
    extra = 0  # <-- LÍNEA INSERTADA
    fields = (
        'producto',
        'producto_nombre_snapshot',
        'cantidad',
        'costo_unitario',
        'precio_unitario',
        'total_costo',
        'total_venta',
        'resultado_venta',
        'observaciones',
    )  # <-- LÍNEA INSERTADA
    readonly_fields = (
        'producto_nombre_snapshot',
        'total_costo',
        'total_venta',
        'resultado_venta',
    )  # <-- LÍNEA INSERTADA


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'fecha_compra',
        'cliente_nombre_snapshot',
        'total_venta',
        'total_pagado',
        'saldo_pendiente',
        'estado',
        'activa',
    )  # <-- LÍNEA INSERTADA
    list_filter = ('estado', 'activa', 'fecha_compra', 'created_at')  # <-- LÍNEA INSERTADA
    search_fields = ('id', 'cliente_nombre_snapshot', 'cuit_snapshot')  # <-- LÍNEA INSERTADA
    ordering = ('-fecha_compra', '-id')  # <-- LÍNEA INSERTADA
    readonly_fields = (
        'cliente_nombre_snapshot',
        'cuit_snapshot',
        'total_costo',
        'total_venta',
        'resultado_venta',
        'total_pagado',
        'saldo_pendiente',
        'estado',
        'created_at',
        'updated_at',
    )  # <-- LÍNEA INSERTADA
    inlines = [VentaItemInline]  # <-- LÍNEA INSERTADA


@admin.register(VentaItem)
class VentaItemAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'venta',
        'producto_nombre_snapshot',
        'cantidad',
        'costo_unitario',
        'precio_unitario',
        'total_venta',
        'resultado_venta',
    )  # <-- LÍNEA INSERTADA
    list_filter = ('created_at',)  # <-- LÍNEA INSERTADA
    search_fields = ('producto_nombre_snapshot', 'venta__cliente_nombre_snapshot')  # <-- LÍNEA INSERTADA
    ordering = ('id',)  # <-- LÍNEA INSERTADA
