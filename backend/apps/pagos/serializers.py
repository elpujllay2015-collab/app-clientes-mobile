from rest_framework import serializers

from apps.pagos.models import Pago
from apps.ventas.models import Venta


class PagoCreateSerializer(serializers.Serializer):
    fecha_pago = serializers.DateField()  # <-- LÍNEA INSERTADA
    cliente_id = serializers.IntegerField()  # <-- LÍNEA INSERTADA
    venta_id = serializers.IntegerField()  # <-- LÍNEA INSERTADA
    monto = serializers.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA
    forma_pago = serializers.ChoiceField(choices=Pago.FORMA_PAGO_CHOICES)  # <-- LÍNEA INSERTADA
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')  # <-- LÍNEA INSERTADA


class PagoListSerializer(serializers.ModelSerializer):
    venta_estado = serializers.CharField(source='venta.estado', read_only=True)  # <-- LÍNEA INSERTADA
    venta_saldo_pendiente = serializers.DecimalField(
        source='venta.saldo_pendiente',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )  # <-- LÍNEA INSERTADA

    class Meta:
        model = Pago
        fields = (
            'id',
            'fecha_pago',
            'cliente',
            'venta',
            'monto',
            'forma_pago',
            'observaciones',
            'activo',
            'created_at',
            'updated_at',
            'venta_estado',
            'venta_saldo_pendiente',
        )


class PagoVentaActualizadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venta
        fields = (
            'id',
            'total_venta',
            'total_pagado',
            'saldo_pendiente',
            'estado',
        )


class PagoCreateResponseSerializer(serializers.ModelSerializer):
    venta_actualizada = serializers.SerializerMethodField()  # <-- LÍNEA INSERTADA

    class Meta:
        model = Pago
        fields = (
            'id',
            'fecha_pago',
            'cliente',
            'venta',
            'monto',
            'forma_pago',
            'observaciones',
            'activo',
            'created_at',
            'updated_at',
            'venta_actualizada',
        )

    def get_venta_actualizada(self, obj):
        return PagoVentaActualizadaSerializer(obj.venta).data  # <-- LÍNEA INSERTADA
