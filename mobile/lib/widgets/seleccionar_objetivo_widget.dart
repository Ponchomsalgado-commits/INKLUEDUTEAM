import 'package:flutter/material.dart';

import '../models/pregunta_data.dart';
import 'skin_assets.dart';

class SeleccionarObjetivoWidget extends StatefulWidget {
  final String? skin;
  final PreguntaData pregunta;

  final int? seleccionInicial;

  final void Function(String preguntaId, int opcionId) onResponder;

  const SeleccionarObjetivoWidget({
    super.key,
    required this.skin,
    required this.pregunta,
    required this.onResponder,
    this.seleccionInicial,
  });

  @override
  State<SeleccionarObjetivoWidget> createState() =>
      _SeleccionarObjetivoWidgetState();
}

class _SeleccionarObjetivoWidgetState extends State<SeleccionarObjetivoWidget> {
  static const double _personajeSize = 64;

  late final SkinAssets _assets = SkinAssets(widget.skin);
  int? _seleccion;

  @override
  void initState() {
    super.initState();
    final s = widget.seleccionInicial;
    _seleccion = (s != null && s >= 0 && s < widget.pregunta.opciones.length)
        ? s
        : null;
  }

  void _onTapObjetivo(int opcionId) {
    setState(() => _seleccion = opcionId); // el personaje "salta" (animado)
    widget.onResponder(widget.pregunta.id, opcionId);
  }

  @override
  Widget build(BuildContext context) {
    final opciones = widget.pregunta.opciones;

    return LayoutBuilder(builder: (context, c) {
      final w = c.maxWidth;
      final h = c.maxHeight;
      final slotW = w / opciones.length;
      final objetivoSize = (slotW - 16).clamp(48.0, 110.0);
      final objetivoTop = h * 0.55;

      Offset destinoDe(int i) => Offset(
            slotW * i + (slotW - _personajeSize) / 2,
            objetivoTop - _personajeSize * 0.5,
          );
      final inicio = Offset((w - _personajeSize) / 2, h * 0.18);
      final pos = _seleccion == null ? inicio : destinoDe(_seleccion!);

      return Stack(children: [
        Positioned.fill(child: _fondo()),

        Positioned(
          left: 16,
          right: 16,
          top: 12,
          child: Text(
            widget.pregunta.texto,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),

        for (var i = 0; i < opciones.length; i++)
          Positioned(
            left: slotW * i,
            top: objetivoTop,
            width: slotW,
            child: Semantics(
              button: true,
              label: opciones[i].texto,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => _onTapObjetivo(i),
                child: _objetivo(opciones[i].texto, objetivoSize, i),
              ),
            ),
          ),

        AnimatedPositioned(
          duration: const Duration(milliseconds: 450),
          curve: Curves.easeOutBack,
          left: pos.dx,
          top: pos.dy,
          child: IgnorePointer(child: _personaje()),
        ),
      ]);
    });
  }

  Widget _fondo() {
    if (_assets.esReserva) {
      return ColoredBox(color: Theme.of(context).colorScheme.surfaceContainer);
    }
    return Image.asset(_assets.fondo, fit: BoxFit.cover);
  }

  Widget _personaje() {
    if (_assets.esReserva) {
      return Container(
        width: _personajeSize,
        height: _personajeSize,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary,
          shape: BoxShape.circle,
        ),
      );
    }
    return Image.asset(_assets.personaje, width: _personajeSize);
  }

  Widget _objetivo(String texto, double size, int index) {
    final elegido = _seleccion == index;
    final imagen = _assets.esReserva
        ? Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(16),
            ),
          )
        : Image.asset(_assets.objetivo, width: size, height: size);

    return Column(mainAxisSize: MainAxisSize.min, children: [
      AnimatedScale(
        scale: elegido ? 1.12 : 1.0,
        duration: const Duration(milliseconds: 200),
        child: imagen,
      ),
      const SizedBox(height: 6),
      Text(
        texto,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontWeight: elegido ? FontWeight.bold : FontWeight.w500,
        ),
      ),
    ]);
  }
}