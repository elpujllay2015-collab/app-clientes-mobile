from django.db import migrations


DEFAULT_EMPRESA_NOMBRE = "Nerca"


def backfill(apps, schema_editor):
    """Crea la empresa por defecto, le asigna todo lo existente y le da un
    perfil a cada usuario que todavia no tenga."""
    Empresa = apps.get_model('empresas', 'Empresa')
    PerfilUsuario = apps.get_model('empresas', 'PerfilUsuario')
    User = apps.get_model('auth', 'User')

    modelos = [
        apps.get_model('clientes', 'Cliente'),
        apps.get_model('productos', 'Producto'),
        apps.get_model('ventas', 'Proveedor'),
        apps.get_model('ventas', 'Venta'),
        apps.get_model('pagos', 'Pago'),
    ]

    cache = {}

    def get_empresa():
        if 'empresa' not in cache:
            cache['empresa'], _ = Empresa.objects.get_or_create(
                nombre=DEFAULT_EMPRESA_NOMBRE,
                defaults={'activo': True},
            )
        return cache['empresa']

    for Model in modelos:
        pendientes = Model.objects.filter(empresa__isnull=True)
        if pendientes.exists():
            pendientes.update(empresa=get_empresa())

    for usuario in User.objects.all():
        if not PerfilUsuario.objects.filter(usuario_id=usuario.id).exists():
            PerfilUsuario.objects.create(usuario_id=usuario.id, empresa=get_empresa())


def revertir(apps, schema_editor):
    # El backfill no se revierte de forma segura; dejamos noop.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('empresas', '0001_initial'),
        ('clientes', '0003_cliente_empresa'),
        ('productos', '0002_producto_empresa'),
        ('ventas', '0004_proveedor_empresa_venta_empresa_alter_proveedor_id'),
        ('pagos', '0002_pago_empresa'),
    ]

    operations = [
        migrations.RunPython(backfill, revertir),
    ]
