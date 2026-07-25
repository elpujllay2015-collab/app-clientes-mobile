from django.db import models

from common.models import TimeStampedModel
from apps.clientes.models import Cliente
from apps.ventas.models import Venta


class Pago(TimeStampedModel):
    FORMA_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('DEBITO', 'Débito'),
        ('CREDITO', 'Crédito'),
        ('OTRO', 'Otro'),
    ]

    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.PROTECT, related_name='pagos', null=True, blank=True)

    fecha_pago = models.DateField()  # <-- LÍNEA INSERTADA

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='pagos')  # <-- LÍNEA INSERTADA
    # venta puede ser NULL cuando el pago es a cuenta inicial (saldo anterior del cliente).
    venta = models.ForeignKey(Venta, on_delete=models.PROTECT, related_name='pagos', null=True, blank=True)

    monto = models.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA
    forma_pago = models.CharField(max_length=20, choices=FORMA_PAGO_CHOICES)  # <-- LÍNEA INSERTADA

    observaciones = models.TextField(blank=True, default='')  # <-- LÍNEA INSERTADA
    activo = models.BooleanField(default=True)  # <-- LÍNEA INSERTADA

    class Meta:
        db_table = 'pagos_pago'  # <-- LÍNEA INSERTADA
        ordering = ['-fecha_pago', '-id']  # <-- LÍNEA INSERTADA

    def __str__(self):
        return f"Pago #{self.id} - {self.monto}"  # <-- LÍNEA INSERTADA