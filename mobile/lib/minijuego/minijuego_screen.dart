import 'package:flutter/material.dart';

import '../models/pregunta_data.dart';
import '../widgets/minijuego_factory.dart';
import 'envio_local.dart';
import 'progreso_api.dart';
import 'progreso_local.dart';

class Pregunta {
  final String id;
  final String enunciado;
  final List<String> opciones;

  const Pregunta({
    required this.id,
    required this.enunciado,
    required this.opciones,
  });
}

const List<Pregunta> _preguntasDePrueba = [
  Pregunta(
    id: 'p1',
    enunciado: '¿Cuál es la capital de Colombia?',
    opciones: ['Medellín', 'Bogotá', 'Cali', 'Cartagena'],
  ),
  Pregunta(
    id: 'p2',
    enunciado: '¿Cuánto es 7 x 8?',
    opciones: ['54', '56', '58', '64'],
  ),
  Pregunta(
    id: 'p3',
    enunciado: '¿Qué planeta es el más cercano al Sol?',
    opciones: ['Venus', 'Marte', 'Mercurio', 'Júpiter'],
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
  bool _enviando = false;
  ResultadoEnvio? _envio;
  late List<int?> _respuestas =
      List<int?>.filled(widget.preguntas.length, null);

  int get _total => widget.preguntas.length;

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
      _finalizarYEnviar();
    }
  }
  Future<void> _finalizarYEnviar() async {
    if (_respuestas.contains(null)) return; // no debería pasar

    final respuestas = [
      for (var i = 0; i < _total; i++)
        RespuestaEnvio(widget.preguntas[i].id, _respuestas[i]!),
    ];

    await EnvioLocal.guardar(widget.id, respuestas);
    await ProgresoLocal.borrar(widget.id);
    await _enviar();
  }

  Future<void> _enviar() async {
    setState(() => _enviando = true);
    final resultado = await ProgresoApi.instancia.enviar(widget.id);
    if (!mounted) return;
    setState(() {
      _envio = resultado;
      _enviando = false;
    });
  }

  void _reiniciar() {
    setState(() {
      _actual = 0;
      _terminado = false;
      _envio = null;
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
              id: p.id,
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
    final r = _envio;

    if (_enviando || r == null) {
      return _panel(
        icono: const CircularProgressIndicator(),
        titulo: 'Enviando tus respuestas…',
        botones: const [],
      );
    }

    switch (r.estado) {
      case EstadoEnvio.exito:
        return _panel(
          icono: const Icon(Icons.emoji_events, size: 72),
          titulo: '¡Terminaste!',
          detalle: (r.score != null && r.total != null)
              ? '${r.score} de ${r.total} respuestas correctas'
              : 'Tus respuestas se enviaron.',
          botones: [
            ElevatedButton(
              onPressed: _reiniciar,
              child: const Text('Intentar de nuevo'),
            ),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Salir'),
            ),
          ],
        );

      case EstadoEnvio.pendiente:
      case EstadoEnvio.enCurso:
        return _panel(
          icono: const Icon(Icons.cloud_off, size: 72),
          titulo: 'Guardamos tus respuestas',
          detalle: 'Se enviarán solas cuando tengas conexión. '
              'No necesitas hacer nada.',
          botones: [
            ElevatedButton(
              onPressed: _enviar,
              child: const Text('Reintentar ahora'),
            ),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Salir'),
            ),
          ],
        );

      case EstadoEnvio.rechazado:
        return _panel(
          icono: const Icon(Icons.error_outline, size: 72),
          titulo: 'No pudimos enviar tus respuestas',
          detalle: r.mensaje,
          botones: [
            ElevatedButton(
              onPressed: _enviar,
              child: const Text('Reintentar'),
            ),
            OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Salir'),
            ),
          ],
        );
    }
  }

  Widget _panel({
    required Widget icono,
    required String titulo,
    String? detalle,
    required List<Widget> botones,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(child: icono),
            const SizedBox(height: 16),
            Text(
              titulo,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            if (detalle != null) ...[
              const SizedBox(height: 8),
              Text(
                detalle,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18),
              ),
            ],
            if (botones.isNotEmpty) const SizedBox(height: 32),
            for (var i = 0; i < botones.length; i++) ...[
              if (i > 0) const SizedBox(height: 12),
              botones[i],
            ],
          ],
        ),
      ),
    );
  }
}