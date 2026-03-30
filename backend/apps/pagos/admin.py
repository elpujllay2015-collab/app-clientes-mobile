from django.contrib import admin

from apps.pagos.models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'fecha_pago',
        'cliente',
        'venta',
        'monto',
        'forma_pago',
        'activo',
        'created_at',
    )  # <-- LÍNEA INSERTADA
    list_filter = ('forma_pago', 'activo', 'fecha_pago', 'created_at')  # <-- LÍNEA INSERTADA
    search_fields = ('cliente__nombre', 'venta__cliente_nombre_snapshot', 'id')  # <-- LÍNEA INSERTADA
    ordering = ('-fecha_pago', '-id')  # <-- LÍNEA INSERTADA
