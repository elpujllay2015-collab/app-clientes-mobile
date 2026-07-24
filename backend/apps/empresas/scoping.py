from rest_framework.exceptions import PermissionDenied


def empresa_de_usuario(user):
    """Devuelve la empresa del usuario logueado o niega el acceso si no tiene."""
    perfil = getattr(user, 'perfil', None)
    if perfil is None or perfil.empresa_id is None:
        raise PermissionDenied(
            'Tu usuario no tiene una empresa asignada. Pedile al administrador que la configure.'
        )
    return perfil.empresa


class EmpresaScopedMixin:
    """Filtra el queryset por la empresa del usuario y asigna la empresa al crear.

    Garantiza que cada empresa vea y modifique unicamente sus propios datos.
    """

    def get_empresa(self):
        return empresa_de_usuario(self.request.user)

    def get_queryset(self):
        return super().get_queryset().filter(empresa=self.get_empresa())

    def perform_create(self, serializer):
        serializer.save(empresa=self.get_empresa())
