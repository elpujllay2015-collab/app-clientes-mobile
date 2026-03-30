from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0002_venta_numero_factura'),
    ]

    operations = [
        migrations.CreateModel(
            name='Proveedor',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('nombre', models.CharField(max_length=150)),
                ('activo', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'ventas_proveedor',
                'ordering': ['nombre'],
            },
        ),
        migrations.AddField(
            model_name='venta',
            name='proveedor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ventas',
                to='ventas.proveedor',
            ),
        ),
    ]