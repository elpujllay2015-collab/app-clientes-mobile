from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pagos', '0004_pagoproveedor'),
    ]

    operations = [
        migrations.AddField(
            model_name='pago',
            name='directo_a_proveedor',
            field=models.BooleanField(default=False),
        ),
    ]
