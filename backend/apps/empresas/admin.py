from django.contrib import admin

from apps.empresas.models import Empresa, PerfilUsuario


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'activo', 'created_at')
    search_fields = ('nombre',)
    list_filter = ('activo',)


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'empresa')
    list_select_related = ('usuario', 'empresa')
    search_fields = ('usuario__username', 'empresa__nombre')
