from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0004_proveedor_empresa_venta_empresa_alter_proveedor_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='saldo_inicial',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
