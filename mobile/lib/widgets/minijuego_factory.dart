import 'package:flutter/material.dart';

import '../models/pregunta_data.dart';
import 'seleccionar_objetivo_widget.dart';

/// Elige el widget según el "type" (mecánica). Un widget por type,
/// nunca por skin. Para agregar una mecánica nueva: crea su widget
/// y agrega un case aquí.
Widget construirMinijuego({
  required String type,
  required String? skin,
  required PreguntaData pregunta,
  required void Function(String preguntaId, int opcionId) onResponder,
  int? seleccionInicial,
}) {
  switch (type) {
    case 'seleccionar_objetivo':
      return SeleccionarObjetivoWidget(
        key: ValueKey(pregunta.id),
        skin: skin,
        pregunta: pregunta,
        onResponder: onResponder,
        seleccionInicial: seleccionInicial,
      );

    default:
      return const _MinijuegoNoSoportado();
  }
}

class _MinijuegoNoSoportado extends StatelessWidget {
  const _MinijuegoNoSoportado();

  @override
  Widget build(BuildContext context) => const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Este minijuego necesita una versión más nueva de la app. '
            'Actualízala para jugarlo.',
            textAlign: TextAlign.center,
          ),
        ),
      );
}