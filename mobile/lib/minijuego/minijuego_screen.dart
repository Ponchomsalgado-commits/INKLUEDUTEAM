import 'package:flutter/material.dart';

import '../models/pregunta_data.dart';
import '../widgets/minijuego_factory.dart';
import 'progreso_local.dart';

class Pregunta {
  final String enunciado;
  final List<String> opciones;
  final int correcta;

  const Pregunta({
    required this.enunciado,
    required this.opciones,
    required this.correcta,
  });
}

const List<Pregunta> _preguntasDePrueba = [
  Pregunta(
    enunciado: '¿Cuál es la capital de Colombia?',
    opciones: ['Medellín', 'Bogotá', 'Cali', 'Cartagena'],
    correcta: 1,
  ),
  Pregunta(
    enunciado: '¿Cuánto es 7 x 8?',
    opciones: ['54', '56', '58', '64'],
    correcta: 1,
  ),
  Pregunta(
    enunciado: '¿Qué planeta es el más cercano al Sol?',
    opciones: ['Venus', 'Marte', 'Mercurio', 'Júpiter'],
    correcta: 2,
  ),
];

class MinijuegoScreen extends StatefulWidget {
  final String id;
  final String titulo;
  final List<Pregunta> preguntas;

  final String type;

  final String? skin;

  const MinijuegoScreen({
    super.key,
    this.id = 'prueba',
    this.titulo = 'Minijuego',
    this.preguntas = _preguntasDePrueba,
    this.type = 'seleccionar_objetivo',
    this.skin,
  });

  @override
  State<MinijuegoScreen> createState() => _MinijuegoScreenState();
}

class _MinijuegoScreenState extends State<MinijuegoScreen> {
  int _actual = 0;
  bool _terminado = false;
  bool _cargado = false;
  late List<int?> _respuestas =
      List<int?>.filled(widget.preguntas.length, null);

  int get _total => widget.preguntas.length;

  int get _aciertos {
    var n = 0;
    for (var i = 0; i < _total; i++) {
      if (_respuestas[i] == widget.preguntas[i].correcta) n++;
    }
    return n;
  }

  @override
  void initState() {
    super.initState();
    _retomarProgreso();
  }

  Future<void> _retomarProgreso() async {
    final guardado = await ProgresoLocal.leer(widget.id, _total);
    if (!mounted) return;

    var retomado = false;
    setState(() {
      if (guardado != null) {
        _respuestas = guardado.respuestas;
        _actual = guardado.actual;
        retomado = _actual > 0 || _respuestas.any((r) => r != null);
      }
      _cargado = true;
    });

    if (retomado) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Retomaste donde te quedaste.')),
      );
    }
  }

  void _seleccionar(int opcion) {
    setState(() => _respuestas[_actual] = opcion);
    ProgresoLocal.guardar(widget.id, _actual, _respuestas);
  }

  void _anterior() {
    if (_actual > 0) {
      setState(() => _actual--);
      ProgresoLocal.guardar(widget.id, _actual, _respuestas);
    }
  }

  void _siguiente() {
    if (_actual < _total - 1) {
      setState(() => _actual++);
      ProgresoLocal.guardar(widget.id, _actual, _respuestas);
    } else {
      setState(() => _terminado = true);
      ProgresoLocal.borrar(widget.id);
    }
  }

  void _reiniciar() {
    setState(() {
      _actual = 0;
      _terminado = false;
      _respuestas = List<int?>.filled(_total, null);
    });
    ProgresoLocal.borrar(widget.id);
  }

  @override
  Widget build(BuildContext context) {
    if (!_cargado) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.titulo)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_total == 0) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.titulo)),
        body: const Center(child: Text('Este minijuego aún no tiene preguntas.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(widget.titulo)),
      body: SafeArea(
        child: _terminado ? _resultado() : _pregunta(),
      ),
    );
  }

  Widget _pregunta() {
    final p = widget.preguntas[_actual];
    final seleccion = _respuestas[_actual];
    final esUltima = _actual == _total - 1;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'Pregunta ${_actual + 1} de $_total',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: (_actual + 1) / _total,
          minHeight: 8,
          borderRadius: BorderRadius.circular(4),
        ),
        const SizedBox(height: 24),

        SizedBox(
          height: 380,
          child: construirMinijuego(
            type: widget.type,
            skin: widget.skin,
            pregunta: PreguntaData(
              id: '$_actual', // provisional (aún no hay id real de backend)
              texto: p.enunciado,
              opciones: [for (final o in p.opciones) OpcionData(texto: o)],
            ),
            seleccionInicial: seleccion,
            onResponder: (_, opcionId) => _seleccionar(opcionId),
          ),
        ),

        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _actual == 0 ? null : _anterior,
                child: const Text('Anterior'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: seleccion == null ? null : _siguiente,
                child: Text(esUltima ? 'Finalizar' : 'Siguiente'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _resultado() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.emoji_events, size: 72),
            const SizedBox(height: 16),
            const Text(
              '¡Terminaste!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '$_aciertos de $_total respuestas correctas',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _reiniciar,
              child: const Text('Intentar de nuevo'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Salir'),
            ),
          ],
        ),
      ),
    );
  }
}