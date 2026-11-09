import 'package:flutter/material.dart';

import '../actividades/actividades_service.dart';
import '../actividades/lista_asignaciones.dart';
import 'salon.dart';

/// Detalle de un salón: tipo, profesor y sus actividades.
class SalonDetalleScreen extends StatefulWidget {
  final Salon salon;
  const SalonDetalleScreen({super.key, required this.salon});

  @override
  State<SalonDetalleScreen> createState() => _SalonDetalleScreenState();
}

class _SalonDetalleScreenState extends State<SalonDetalleScreen> {
  final _service = ActividadesService();
  SalonDetalle? _detalle;

  @override
  void initState() {
    super.initState();
    _cargarDetalle();
  }

  Future<void> _cargarDetalle() async {
    try {
      final d = await _service.salon(widget.salon.id);
      if (mounted) {
        setState(() {
          _detalle = d;
        });
      }
    } catch (_) {
      // Si falla, se muestran los datos básicos que ya tenemos
    }
  }

  Widget _encabezado() {
    final s = widget.salon;
    final tutoria = _detalle?.esTutoria ?? s.esTutoria;
    final email = _detalle?.profesorEmail;
    return Card(
      color: tutoria ? const Color(0xFFF3E8FF) : const Color(0xFFE3F2FD),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(tutoria ? Icons.person : Icons.groups, size: 28),
              const SizedBox(width: 8),
              Text(
                tutoria ? 'Tutoría individual' : 'Salón',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ]),
            const SizedBox(height: 8),
            Text(_detalle?.nombre ?? s.nombre,
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            if (email != null) ...[
              const SizedBox(height: 8),
              Row(children: [
                const Icon(Icons.school, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${tutoria ? 'Tutor' : 'Profesor'}: $email',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ]),
            ],
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.salon.nombre)),
      body: ListaAsignaciones(
        cargar: () => _service.asignacionesDeSalon(widget.salon.id),
        textoVacio: 'Este salón aún no tiene actividades.\n¡Disfruta tu descanso!',
        mostrarSalon: false,
        encabezado: _encabezado(),
      ),
    );
  }
}
