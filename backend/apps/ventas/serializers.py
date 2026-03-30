from rest_framework import serializers
import re

from apps.clientes.models import Cliente
from apps.pagos.models import Pago
from apps.productos.models import Producto
from apps.ventas.models import Proveedor, Venta, VentaItem


class VentaClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ('id', 'nombre', 'cuit')


class VentaProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ('id', 'nombre')




class VentaProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ('id', 'nombre', 'activo')


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ('id', 'nombre', 'activo', 'created_at', 'updated_at')


class VentaItemReadSerializer(serializers.ModelSerializer):
    producto = VentaProductoSerializer(read_only=True)

    class Meta:
        model = VentaItem
        fields = (
            'id',
            'producto',
            'producto_nombre_snapshot',
            'cantidad',
            'costo_unitario',
            'precio_unitario',
            'total_costo',
            'total_venta',
            'resultado_venta',
            'observaciones',
        )


class VentaPagoReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = (
            'id',
            'fecha_pago',
            'monto',
            'forma_pago',
            'observaciones',
            'activo',
        )


class VentaItemCreateSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()  # <-- LÍNEA INSERTADA
    cantidad = serializers.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA
    costo_unitario = serializers.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA
    precio_unitario = serializers.DecimalField(max_digits=12, decimal_places=2)  # <-- LÍNEA INSERTADA
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')  # <-- LÍNEA INSERTADA


class VentaCreateSerializer(serializers.Serializer):
    fecha_compra = serializers.DateField()  # <-- LÍNEA INSERTADA
    cliente_id = serializers.IntegerField()
    proveedor_id = serializers.IntegerField()  # <-- LÍNEA INSERTADA
    numero_factura = serializers.CharField(required=False, allow_blank=True, default='')  # <-- LÍNEA INSERTADA
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')  # <-- LÍNEA INSERTADA
    items = VentaItemCreateSerializer(many=True)  # <-- LÍNEA INSERTADA

    def validate_numero_factura(self, value):
        numero_factura = (value or '').strip()
        if numero_factura and not re.fullmatch(r'\d{8}', numero_factura):
            raise serializers.ValidationError('El número de factura debe tener exactamente 8 dígitos numéricos.')
        return numero_factura


class VentaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venta
        fields = (
            'id',
            'fecha_compra',
            'cliente',
            'proveedor',
            'cliente_nombre_snapshot',
            'numero_factura',
            'cuit_snapshot',
            'total_costo',
            'total_venta',
            'resultado_venta',
            'total_pagado',
            'saldo_pendiente',
            'estado',
            'observaciones',
            'activa',
            'created_at',
            'updated_at',
        )


class VentaDetailSerializer(serializers.ModelSerializer):
    cliente = VentaClienteSerializer(read_only=True)
    proveedor = VentaProveedorSerializer(read_only=True)
    items = VentaItemReadSerializer(many=True, read_only=True)
    pagos = VentaPagoReadSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = (
            'id',
            'fecha_compra',
            'cliente',
            'proveedor',
            'cliente_nombre_snapshot',
            'numero_factura',
            'cuit_snapshot',
            'total_costo',
            'total_venta',
            'resultado_venta',
            'total_pagado',
            'saldo_pendiente',
            'estado',
            'observaciones',
            'activa',
            'created_at',
            'updated_at',
            'items',
            'pagos',
        )
