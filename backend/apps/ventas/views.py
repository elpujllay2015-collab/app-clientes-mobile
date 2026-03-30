from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.ventas.models import Proveedor, Venta
from apps.ventas.serializers import (
    VentaCreateSerializer,
    VentaDetailSerializer,
    VentaListSerializer,
    ProveedorSerializer,
)
from apps.ventas.services import crear_venta_con_items


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.select_related('cliente', 'proveedor').prefetch_related('items', 'pagos').all()  # <-- LÍNEA CORREGIDA

    def get_serializer_class(self):
        if self.action == 'create':
            return VentaCreateSerializer  # <-- LÍNEA INSERTADA
        if self.action == 'retrieve':
            return VentaDetailSerializer  # <-- LÍNEA INSERTADA
        return VentaListSerializer  # <-- LÍNEA CORREGIDA

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)  # <-- LÍNEA INSERTADA
        serializer.is_valid(raise_exception=True)  # <-- LÍNEA INSERTADA

        venta = crear_venta_con_items(
            fecha_compra=serializer.validated_data['fecha_compra'],
            cliente_id=serializer.validated_data['cliente_id'],
            proveedor_id=serializer.validated_data['proveedor_id'],
            numero_factura=serializer.validated_data.get('numero_factura', ''),
            observaciones=serializer.validated_data.get('observaciones', ''),
            items=serializer.validated_data['items'],
        )  # <-- LÍNEA INSERTADA

        response_serializer = VentaDetailSerializer(venta)  # <-- LÍNEA INSERTADA
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)  # <-- LÍNEA INSERTADA



class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
