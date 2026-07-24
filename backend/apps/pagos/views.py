from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.empresas.scoping import EmpresaScopedMixin
from apps.pagos.models import Pago
from apps.pagos.serializers import (
    PagoCreateResponseSerializer,
    PagoCreateSerializer,
    PagoListSerializer,
)
from apps.pagos.services import registrar_pago_venta


class PagoViewSet(EmpresaScopedMixin, viewsets.ModelViewSet):
    queryset = Pago.objects.select_related('cliente', 'venta').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return PagoCreateSerializer
        return PagoListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        pago, venta = registrar_pago_venta(
            empresa=self.get_empresa(),
            fecha_pago=serializer.validated_data['fecha_pago'],
            cliente_id=serializer.validated_data['cliente_id'],
            venta_id=serializer.validated_data['venta_id'],
            monto=serializer.validated_data['monto'],
            forma_pago=serializer.validated_data['forma_pago'],
            observaciones=serializer.validated_data.get('observaciones', ''),
        )

        pago.venta = venta
        response_serializer = PagoCreateResponseSerializer(pago)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
