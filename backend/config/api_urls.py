from rest_framework.routers import DefaultRouter
from django.urls import path

from apps.clientes.views import ClienteViewSet
from apps.productos.views import ProductoViewSet
from apps.ventas.views import ProveedorViewSet, VentaViewSet
from apps.pagos.views import PagoViewSet

# 👉 NUEVO IMPORT
from apps.dashboard.views import DashboardResumenView, ResultadosPorProveedorView, ResultadosVentasView


router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'pagos', PagoViewSet)

# 👉 NO BORRAMOS NADA, solo extendemos
urlpatterns = [
    path('dashboard/resumen/', DashboardResumenView.as_view()),
    path('resultados/ventas/', ResultadosVentasView.as_view()),
    path('resultados/proveedores/', ResultadosPorProveedorView.as_view()),
]

# 👉 mantenemos el router
urlpatterns += router.urls