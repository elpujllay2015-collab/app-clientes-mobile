from django.contrib import admin

from apps.productos.models import Producto


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'costo', 'precio_venta', 'activo', 'created_at')  # <-- LÍNEA INSERTADA
    list_filter = ('activo', 'created_at')  # <-- LÍNEA INSERTADA
    search_fields = ('nombre',)  # <-- LÍNEA INSERTADA
    ordering = ('nombre', 'id')  # <-- LÍNEA INSERTADA
