import 'package:flutter/material.dart';

import 'modelos.dart';

/// Colores e icono de cada estado (tonos tranquilos).
({Color fondo, Color texto, IconData icono}) estiloEstado(EstadoAsignacion e) {
  switch (e) {
    case EstadoAsignacion.completado:
      return (
        fondo: const Color(0xFFDCF3E3),
        texto: const Color(0xFF1E6B3A),
        icono: Icons.check_circle,
      );
    case EstadoAsignacion.atrasado:
      return (
        fondo: const Color(0xFFFFE6CC),
        texto: const Color(0xFF9A4A00),
        icono: Icons.schedule,
      );
    case EstadoAsignacion.pendiente:
      return (
        fondo: const Color(0xFFE3ECFF),
        texto: const Color(0xFF2A4A9A),
        icono: Icons.play_circle_outline,
      );
  }
}

class ChipEstado extends StatelessWidget {
  final EstadoAsignacion estado;
  final UltimoIntento? intento;
  const ChipEstado({super.key, required this.estado, this.intento});

  @override
  Widget build(BuildContext context) {
    final s = estiloEstado(estado);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: s.fondo,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(s.icono, size: 18, color: s.texto),
          const SizedBox(width: 6),
          Text(
            textoEstado(estado, intento),
            style: TextStyle(
              color: s.texto,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class TarjetaAsignacion extends StatelessWidget {
  final Asignacion asignacion;
  final VoidCallback onTap;
  final bool mostrarSalon;

  const TarjetaAsignacion({
    super.key,
    required this.asignacion,
    required this.onTap,
    this.mostrarSalon = true,
  });

  @override
  Widget build(BuildContext context) {
    final a = asignacion;
    final atrasada = a.estado == EstadoAsignacion.atrasado;
    final estilo = estiloEstado(a.estado);

    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: atrasada
            ? BorderSide(color: estilo.texto, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      a.titulo,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Icon(Icons.chevron_right, size: 28),
                ],
              ),
              if (mostrarSalon) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(a.esTutoria ? Icons.person : Icons.groups, size: 18),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(a.salonNombre,
                          style: const TextStyle(fontSize: 16)),
                    ),
                  ],
                ),
              ],
              if (a.fechaLimite != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.event,
                        size: 18, color: atrasada ? estilo.texto : null),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Entrega: ${fechaAmigable(a.fechaLimite!)}',
                        style: TextStyle(
                          fontSize: 16,
                          color: atrasada ? estilo.texto : null,
                          fontWeight: atrasada ? FontWeight.w600 : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              ChipEstado(estado: a.estado, intento: a.ultimoIntento),
              if (atrasada) ...[
                const SizedBox(height: 8),
                Text(
                  'Aún puedes hacerla. ¡Tú puedes!',
                  style: TextStyle(fontSize: 15, color: estilo.texto),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
