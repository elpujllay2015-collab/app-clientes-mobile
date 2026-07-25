import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('empresas', '0001_initial'),
        ('ventas', '0005_proveedor_saldo_inicial'),
        ('pagos', '0003_alter_pago_venta'),
    ]

    operations = [
        migrations.CreateModel(
            name='PagoProveedor',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('fecha_pago', models.DateField()),
                ('monto', models.DecimalField(decimal_places=2, max_digits=12)),
                ('forma_pago', models.CharField(choices=[('EFECTIVO', 'Efectivo'), ('TRANSFERENCIA', 'Transferencia'), ('DEBITO', 'Débito'), ('CREDITO', 'Crédito'), ('OTRO', 'Otro')], max_length=20)),
                ('observaciones', models.TextField(blank=True, default='')),
                ('activo', models.BooleanField(default=True)),
                ('empresa', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='pagos_proveedor', to='empresas.empresa')),
                ('proveedor', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pagos', to='ventas.proveedor')),
            ],
            options={
                'db_table': 'pagos_pago_proveedor',
                'ordering': ['-fecha_pago', '-id'],
            },
        ),
    ]
