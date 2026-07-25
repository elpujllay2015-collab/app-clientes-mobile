from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from rest_framework import serializers

from apps.clientes.models import Cliente

_D2 = Decimal('0.01')


class ClienteSerializer(serializers.ModelSerializer):
    # Cuánto del saldo inicial (deuda anterior) ya se cobró y cuánto queda pendiente.
    saldo_inicial_pagado = serializers.SerializerMethodField()
    saldo_inicial_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = '__all__'
        read_only_fields = ('empresa',)

    def _pagado_inicial(self, obj):
        total = obj.pagos.filter(activo=True, venta__isnull=True).aggregate(s=Sum('monto'))['s'] or Decimal('0')
        return Decimal(str(total)).quantize(_D2, rounding=ROUND_HALF_UP)

    def get_saldo_inicial_pagado(self, obj):
        return str(self._pagado_inicial(obj))

    def get_saldo_inicial_pendiente(self, obj):
        pendiente = (Decimal(str(obj.saldo_inicial)) - self._pagado_inicial(obj)).quantize(_D2, rounding=ROUND_HALF_UP)
        return str(pendiente if pendiente > 0 else Decimal('0.00'))
