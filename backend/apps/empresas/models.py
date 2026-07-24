from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Empresa(TimeStampedModel):
    """Cada negocio que usa la app. Aísla los datos: cada empresa ve solo lo suyo."""
    nombre = models.CharField(max_length=150, db_index=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'empresas_empresa'
        ordering = ['nombre', 'id']

    def __str__(self):
        return self.nombre


class PerfilUsuario(TimeStampedModel):
    """Ata cada usuario de login a una empresa."""
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil',
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.PROTECT,
        related_name='usuarios',
    )

    class Meta:
        db_table = 'empresas_perfil_usuario'

    def __str__(self):
        return f'{self.usuario} @ {self.empresa}'
