from rest_framework import viewsets

from apps.clientes.models import Cliente
from apps.empresas.scoping import EmpresaScopedMixin
from .serializers import ClienteSerializer


class ClienteViewSet(EmpresaScopedMixin, viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
