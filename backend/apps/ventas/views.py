from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.empresas.scoping import EmpresaScopedMixin
from apps.ventas.models import Proveedor, Venta
from apps.ventas.serializers import (
    VentaCreateSerializer,
    VentaDetailSerializer,
    VentaListSerializer,
    ProveedorSerializer,
)
from apps.ventas.services import crear_venta_con_items


class VentaViewSet(EmpresaScopedMixin, viewsets.ModelViewSet):
    queryset = Venta.objects.select_related('cliente', 'proveedor').prefetch_related('items', 'pagos').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return VentaCreateSerializer
        if self.action == 'retrieve':
            return VentaDetailSerializer
        return VentaListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        venta = crear_venta_con_items(
            empresa=self.get_empresa(),
            fecha_compra=serializer.validated_data['fecha_compra'],
            cliente_id=serializer.validated_data['cliente_id'],
            proveedor_id=serializer.validated_data['proveedor_id'],
            numero_factura=serializer.validated_data.get('numero_factura', ''),
            observaciones=serializer.validated_data.get('observaciones', ''),
            items=serializer.validated_data['items'],
        )

        response_serializer = VentaDetailSerializer(venta)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProveedorViewSet(EmpresaScopedMixin, viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
