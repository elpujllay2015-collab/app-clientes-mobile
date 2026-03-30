from django.db import models
from common.models import TimeStampedModel

class Cliente(TimeStampedModel):
    nombre = models.CharField(max_length=150, db_index=True)
    cuit = models.CharField(max_length=20, blank=True, default='', db_index=True)
    telefono = models.CharField(max_length=30, blank=True, default='')
    direccion = models.CharField(max_length=255, blank=True, default='')
    observaciones = models.TextField(blank=True, default='')
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # <-- LÍNEA INSERTADA
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'clientes_cliente'
        ordering = ['nombre', 'id']

    def __str__(self):
        return self.nombre
