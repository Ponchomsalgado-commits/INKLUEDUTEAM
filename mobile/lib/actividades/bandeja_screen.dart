import 'package:flutter/material.dart';

import 'actividades_service.dart';
import 'lista_asignaciones.dart';

/// "Mis actividades": todas las actividades de todos mis salones,
/// ordenadas por fecha de entrega.
class BandejaScreen extends StatelessWidget {
  const BandejaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = ActividadesService();
    return Scaffold(
      appBar: AppBar(title: const Text('Mis actividades')),
      body: ListaAsignaciones(
        cargar: () async {
          final lista = await service.misAsignaciones();
          // El backend ya las ordena; lo aseguramos por si acaso
          lista.sort((a, b) {
            final fa = a.fechaLimite, fb = b.fechaLimite;
            if (fa == null) return fb == null ? 0 : 1;
            if (fb == null) return -1;
            return fa.compareTo(fb);
          });
          return lista;
        },
        textoVacio:
            'No tienes actividades por ahora.\nCuando tu profesor publique una, aparecerá aquí.',
      ),
    );
  }
}
