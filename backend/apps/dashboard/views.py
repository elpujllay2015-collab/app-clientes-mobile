from django.db.models import Count, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ventas.models import Venta


class DashboardResumenView(APIView):
    def get(self, request):
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        proveedor_id = request.GET.get('proveedor_id')

        qs = Venta.objects.filter(activa=True)
        if fecha_desde:
            qs = qs.filter(fecha_compra__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_compra__lte=fecha_hasta)
        if proveedor_id:
            qs = qs.filter(proveedor_id=proveedor_id)

        data = qs.aggregate(
            total_costo=Sum('total_costo'),
            total_venta=Sum('total_venta'),
            resultado_venta=Sum('resultado_venta'),
            total_pagado=Sum('total_pagado'),
            saldo_pendiente=Sum('saldo_pendiente'),
            cantidad_ventas=Count('id'),
        )

        response = {
            'fecha_desde': fecha_desde or '',
            'fecha_hasta': fecha_hasta or '',
            'total_costo': str(data['total_costo'] or 0),
            'total_venta': str(data['total_venta'] or 0),
            'resultado_venta': str(data['resultado_venta'] or 0),
            'total_pagado': str(data['total_pagado'] or 0),
            'saldo_pendiente': str(data['saldo_pendiente'] or 0),
            'cantidad_ventas': data['cantidad_ventas'] or 0,
        }
        return Response(response)


class ResultadosVentasView(APIView):
    def get(self, request):
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        proveedor_id = request.GET.get('proveedor_id')

        qs = Venta.objects.filter(activa=True).order_by('-fecha_compra', '-id')
        if fecha_desde:
            qs = qs.filter(fecha_compra__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_compra__lte=fecha_hasta)
        if proveedor_id:
            qs = qs.filter(proveedor_id=proveedor_id)

        data = []
        for venta in qs:
            data.append({
                'id': venta.id,
                'fecha_compra': str(venta.fecha_compra),
                'cliente_nombre_snapshot': venta.cliente_nombre_snapshot,
                'numero_factura': venta.numero_factura,
                'total_costo': str(venta.total_costo),
                'total_venta': str(venta.total_venta),
                'resultado_venta': str(venta.resultado_venta),
                'total_pagado': str(venta.total_pagado),
                'saldo_pendiente': str(venta.saldo_pendiente),
                'estado': venta.estado,
            })

        return Response(data)


class ResultadosPorProveedorView(APIView):
    def get(self, request):
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        proveedor_id = request.GET.get('proveedor_id')

        qs = Venta.objects.select_related('proveedor', 'cliente').filter(activa=True).order_by('proveedor__nombre', 'cliente_nombre_snapshot', '-fecha_compra', '-id')
        if fecha_desde:
            qs = qs.filter(fecha_compra__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_compra__lte=fecha_hasta)
        if proveedor_id:
            qs = qs.filter(proveedor_id=proveedor_id)

        grouped = {}
        for venta in qs:
            proveedor_id = venta.proveedor_id or 0
            proveedor_nombre = venta.proveedor.nombre if venta.proveedor_id else 'Sin proveedor'

            if proveedor_id not in grouped:
                grouped[proveedor_id] = {
                    'proveedor_id': proveedor_id if venta.proveedor_id else None,
                    'proveedor_nombre': proveedor_nombre,
                    'total_costo': 0.0,
                    'total_venta': 0.0,
                    'resultado_venta': 0.0,
                    'total_pagado': 0.0,
                    'saldo_pendiente': 0.0,
                    'cantidad_ventas': 0,
                    'clientes_map': {},
                }

            item = grouped[proveedor_id]
            item['total_costo'] += float(venta.total_costo or 0)
            item['total_venta'] += float(venta.total_venta or 0)
            item['resultado_venta'] += float(venta.resultado_venta or 0)
            item['total_pagado'] += float(venta.total_pagado or 0)
            item['saldo_pendiente'] += float(venta.saldo_pendiente or 0)
            item['cantidad_ventas'] += 1

            cliente_key = venta.cliente_id
            if cliente_key not in item['clientes_map']:
                item['clientes_map'][cliente_key] = {
                    'cliente_id': venta.cliente_id,
                    'cliente_nombre': venta.cliente_nombre_snapshot,
                    'saldo_pendiente': 0.0,
                }

            item['clientes_map'][cliente_key]['saldo_pendiente'] += float(venta.saldo_pendiente or 0)

        response = []
        for proveedor_id, item in grouped.items():
            clientes = list(item.pop('clientes_map').values())
            clientes.sort(key=lambda x: (-x['saldo_pendiente'], x['cliente_nombre'] or ''))

            margen = ((item['resultado_venta'] / item['total_costo']) * 100) if item['total_costo'] else 0.0

            if item['resultado_venta'] < 0:
                kpi_estado = 'perdida'
            elif margen < 5:
                kpi_estado = 'bajo_margen'
            else:
                kpi_estado = 'rentable'

            response.append({
                'proveedor_id': item['proveedor_id'],
                'proveedor_nombre': item['proveedor_nombre'],
                'total_costo': f"{item['total_costo']:.2f}",
                'total_venta': f"{item['total_venta']:.2f}",
                'resultado_venta': f"{item['resultado_venta']:.2f}",
                'margen_porcentaje': f"{margen:.2f}",
                'kpi_estado': kpi_estado,
                'total_pagado': f"{item['total_pagado']:.2f}",
                'saldo_pendiente': f"{item['saldo_pendiente']:.2f}",
                'cantidad_ventas': item['cantidad_ventas'],
                'clientes': [
                    {
                        'cliente_id': cliente['cliente_id'],
                        'cliente_nombre': cliente['cliente_nombre'],
                        'saldo_pendiente': f"{cliente['saldo_pendiente']:.2f}",
                    }
                    for cliente in clientes
                ],
            })

        response.sort(key=lambda x: (x['proveedor_nombre'] or '').lower())
        return Response(response)
