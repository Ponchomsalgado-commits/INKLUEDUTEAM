import 'package:flutter/material.dart';

import 'actividades_service.dart';
import 'modelos.dart';
import 'premenu_screen.dart';
import 'tarjeta_asignacion.dart';

/// Lista de actividades con carga, vacío, error y "jalar para actualizar".
/// Se usa en la bandeja y en el detalle de un salón.
class ListaAsignaciones extends StatefulWidget {
  final Future<List<Asignacion>> Function() cargar;
  final String textoVacio;
  final bool mostrarSalon;

  /// Contenido opcional arriba de la lista (p. ej. datos del salón).
  final Widget? encabezado;

  const ListaAsignaciones({
    super.key,
    required this.cargar,
    required this.textoVacio,
    this.mostrarSalon = true,
    this.encabezado,
  });

  @override
  State<ListaAsignaciones> createState() => _ListaAsignacionesState();
}

class _ListaAsignacionesState extends State<ListaAsignaciones> {
  List<Asignacion>? _items;
  Object? _error;
  bool _cargando = true;

  @override
  void initState() {
    super.initState();
    _recargar();
  }

  Future<void> _recargar() async {
    setState(() {
      _cargando = _items == null;
      _error = null;
    });
    try {
      final items = await widget.cargar();
      if (!mounted) return;
      setState(() {
        _items = items;
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

  Future<void> _abrir(Asignacion a) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => PremenuScreen(asignacion: a)),
    );
    // Al volver, actualizamos el estado (pudo completarla)
    if (mounted) _recargar();
  }

  Widget _mensaje(IconData icono, String texto, {Widget? boton}) {
    return ListView(
      // ListView para que "jalar para actualizar" funcione también aquí
      padding: const EdgeInsets.all(24),
      children: [
        ?widget.encabezado,
        const SizedBox(height: 48),
        Icon(icono, size: 64, color: Colors.blueGrey),
        const SizedBox(height: 16),
        Text(texto,
            textAlign: TextAlign.center, style: const TextStyle(fontSize: 18)),
        if (boton != null) ...[
          const SizedBox(height: 16),
          Center(child: boton),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Center(child: CircularProgressIndicator());
    }

    Widget contenido;
    final items = _items;
    if (_error != null && items == null) {
      contenido = _mensaje(
        Icons.cloud_off,
        mensajeDeError(_error!,
            porDefecto: 'No pudimos cargar tus actividades.'),
        boton: ElevatedButton.icon(
          onPressed: _recargar,
          icon: const Icon(Icons.refresh),
          label: const Text('Reintentar'),
        ),
      );
    } else if (items == null || items.isEmpty) {
      contenido = _mensaje(Icons.beach_access, widget.textoVacio);
    } else {
      contenido = ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length + (widget.encabezado != null ? 1 : 0),
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          if (widget.encabezado != null) {
            if (i == 0) return widget.encabezado!;
            i--;
          }
          final a = items[i];
          return TarjetaAsignacion(
            key: ValueKey(a.id),
            asignacion: a,
            mostrarSalon: widget.mostrarSalon,
            onTap: () => _abrir(a),
          );
        },
      );
    }

    return RefreshIndicator(onRefresh: _recargar, child: contenido);
  }
}
