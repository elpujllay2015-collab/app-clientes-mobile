from django.db import models

from common.models import TimeStampedModel


class Producto(TimeStampedModel):
    nombre = models.CharField(max_length=150, db_index=True)  # <-- LÍNEA INSERTADA
    costo = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    activo = models.BooleanField(default=True)  # <-- LÍNEA INSERTADA

    class Meta:
        db_table = 'productos_producto'  # <-- LÍNEA INSERTADA
        ordering = ['nombre', 'id']  # <-- LÍNEA INSERTADA

    def __str__(self):
        return self.nombre  # <-- LÍNEA INSERTADA