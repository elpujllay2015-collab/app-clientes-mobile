from django.contrib import admin

from apps.clientes.models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'cuit', 'telefono', 'activo', 'created_at')  # <-- LÍNEA INSERTADA
    list_filter = ('activo', 'created_at')  # <-- LÍNEA INSERTADA
    search_fields = ('nombre', 'cuit', 'telefono')  # <-- LÍNEA INSERTADA
    ordering = ('nombre', 'id')  # <-- LÍNEA INSERTADA
