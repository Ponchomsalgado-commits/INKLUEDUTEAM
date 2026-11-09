import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../minijuego/minijuego_screen.dart';
import '../reproductor/reproductor_screen.dart';
import 'actividades_service.dart';
import 'modelos.dart';
import 'tarjeta_asignacion.dart';

/// Menú previo de una actividad: jugar o revisar el material, en el orden
/// que el estudiante prefiera.
class PremenuScreen extends StatefulWidget {
  final Asignacion asignacion;
  const PremenuScreen({super.key, required this.asignacion});

  @override
  State<PremenuScreen> createState() => _PremenuScreenState();
}

class _PremenuScreenState extends State<PremenuScreen> {
  final _service = ActividadesService();
  late Asignacion _asignacion = widget.asignacion;
  ActividadPlay? _play;
  Object? _error;
  bool _cargando = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final play = await _service.play(_asignacion.actividadId);
      if (!mounted) return;
      setState(() {
        _play = play;
        _cargando = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _cargando = false;
      });
    }
  }

  /// Vuelve a pedir el estado de esta asignación (tras jugar).
  Future<void> _actualizarEstado() async {
    try {
      final lista =
          await _service.misAsignaciones(salonId: _asignacion.salonId);
      final nueva = lista.where((a) => a.id == _asignacion.id).firstOrNull;
      if (nueva != null && mounted) setState(() => _asignacion = nueva);
    } catch (_) {
      // Sin red: se queda el estado anterior
    }
  }

  Future<void> _jugar() async {
    final p = _play!;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MinijuegoScreen(
          id: p.actividadId,
          titulo: p.titulo,
          preguntas: p.preguntas,
          type: p.type,
          skin: p.skin,
        ),
      ),
    );
    if (mounted) _actualizarEstado();
  }

  Future<void> _abrirMaterial(MaterialItem m) async {
    if (m.tipo == TipoMaterial.pdf || m.tipo == TipoMaterial.otro) {
      final ok = await launchUrl(Uri.parse(m.url),
          mode: LaunchMode.externalApplication);
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No pudimos abrir este archivo.')),
        );
      }
      return;
    }
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ReproductorScreen(material: m)),
    );
  }

  ({String texto, IconData icono}) _boton(TipoMaterial t) {
    switch (t) {
      case TipoMaterial.texto:
        return (texto: 'Leer', icono: Icons.menu_book);
      case TipoMaterial.video:
        return (texto: 'Ver video', icono: Icons.ondemand_video);
      case TipoMaterial.audio:
        return (texto: 'Escuchar', icono: Icons.headphones);
      case TipoMaterial.pdf:
        return (texto: 'Abrir PDF', icono: Icons.picture_as_pdf);
      case TipoMaterial.otro:
        return (texto: 'Abrir', icono: Icons.attach_file);
    }
  }

  Widget _encabezado() {
    final a = _asignacion;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_play?.titulo ?? a.titulo,
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(children: [
              Icon(a.esTutoria ? Icons.person : Icons.groups, size: 20),
              const SizedBox(width: 6),
              Expanded(
                  child: Text(a.salonNombre,
                      style: const TextStyle(fontSize: 17))),
            ]),
            if (a.fechaLimite != null) ...[
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.event, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text('Entrega: ${fechaAmigable(a.fechaLimite!)}',
                      style: const TextStyle(fontSize: 17)),
                ),
              ]),
            ],
            const SizedBox(height: 12),
            ChipEstado(estado: a.estado, intento: a.ultimoIntento),
          ],
        ),
      ),
    );
  }

  Widget _botonGrande({
    required IconData icono,
    required String texto,
    required VoidCallback onPressed,
    bool principal = false,
  }) {
    final estilo = ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(Size.fromHeight(64)),
      textStyle: const WidgetStatePropertyAll(
          TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
      shape: WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
    );
    return principal
        ? FilledButton.icon(
            style: estilo,
            onPressed: onPressed,
            icon: Icon(icono, size: 28),
            label: Text(texto))
        : OutlinedButton.icon(
            style: estilo,
            onPressed: onPressed,
            icon: Icon(icono, size: 28),
            label: Text(texto));
  }

  @override
  Widget build(BuildContext context) {
    final p = _play;
    final hijos = <Widget>[_encabezado(), const SizedBox(height: 24)];

    if (_cargando) {
      hijos.add(const Center(child: CircularProgressIndicator()));
    } else if (_error != null || p == null) {
      hijos.addAll([
        Text(
          mensajeDeError(_error ?? 'x',
              porDefecto: 'No pudimos abrir esta actividad.'),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18),
        ),
        const SizedBox(height: 16),
        Center(
          child: ElevatedButton.icon(
            onPressed: _cargar,
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
          ),
        ),
      ]);
    } else {
      hijos.addAll([
        const Text('¿Qué quieres hacer?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        const Text('Puedes elegir en el orden que quieras.',
            style: TextStyle(fontSize: 16)),
        const SizedBox(height: 16),
        _botonGrande(
          icono: Icons.sports_esports,
          texto: _asignacion.estado == EstadoAsignacion.completado
              ? 'Jugar otra vez'
              : 'Jugar',
          onPressed: _jugar,
          principal: true,
        ),
        for (final m in p.materiales) ...[
          const SizedBox(height: 12),
          _botonGrande(
            icono: _boton(m.tipo).icono,
            texto: p.materiales.length > 1
                ? '${_boton(m.tipo).texto}: ${m.nombre}'
                : _boton(m.tipo).texto,
            onPressed: () => _abrirMaterial(m),
          ),
        ],
      ]);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Actividad')),
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(16), children: hijos),
      ),
    );
  }
}
