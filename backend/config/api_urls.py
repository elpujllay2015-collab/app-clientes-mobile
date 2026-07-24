from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.clientes.views import ClienteViewSet
from apps.productos.views import ProductoViewSet
from apps.ventas.views import ProveedorViewSet, VentaViewSet
from apps.pagos.views import PagoViewSet
from apps.dashboard.views import DashboardResumenView, ResultadosPorProveedorView, ResultadosVentasView
from common.auth_views import ChangePasswordView, CurrentUserView


class PublicTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]


class PublicTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'pagos', PagoViewSet)

urlpatterns = [
    path('auth/login/', PublicTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', PublicTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('dashboard/resumen/', DashboardResumenView.as_view()),
    path('resultados/ventas/', ResultadosVentasView.as_view()),
    path('resultados/proveedores/', ResultadosPorProveedorView.as_view()),
]

urlpatterns += router.urls
