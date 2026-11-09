import 'package:flutter/material.dart';

import '../actividades/actividades_service.dart';
import 'insignias.dart';

/// "Mi perfil": racha, actividades completadas e insignias.
/// Nunca se compara con otros estudiantes.
class PerfilScreen extends StatefulWidget {
  const PerfilScreen({super.key});

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  late Future<MisInsignias> _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = MisInsignias.cargar();
  }

  Future<void> _recargar() async {
    final f = MisInsignias.cargar();
    setState(() {
      _futuro = f;
    });
    try {
      await f;
    } catch (_) {
      // El FutureBuilder muestra el error
    }
  }

  Widget _dato(IconData icono, Color color, String valor, String etiqueta) {
    return Expanded(
      child: Card(
        color: color.withValues(alpha: 0.15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
          child: Column(
            children: [
              Icon(icono, size: 40, color: color),
              const SizedBox(height: 8),
              Text(valor,
                  style: const TextStyle(
                      fontSize: 30, fontWeight: FontWeight.bold)),
              Text(etiqueta,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 15)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _insignia(Insignia b, {required bool ganada}) {
    const calido = Color(0xFFFF9F1C);
    return Card(
      elevation: ganada ? 2 : 0,
      color: ganada ? const Color(0xFFFFF4E0) : const Color(0xFFF5F5F7),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor:
                  ganada ? calido : Colors.blueGrey.withValues(alpha: 0.15),
              child: Icon(iconoDeInsignia(b.icono),
                  size: 30, color: ganada ? Colors.white : Colors.blueGrey),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Flexible(
                      child: Text(b.nombre,
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: ganada ? null : Colors.blueGrey)),
                    ),
                    if (ganada && b.streakCount > 1) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: calido,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text('x${b.streakCount}',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ]),
                  const SizedBox(height: 4),
                  Text(b.descripcion,
                      style: TextStyle(
                          fontSize: 15,
                          color: ganada ? null : Colors.blueGrey)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _contenido(MisInsignias m) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(children: [
          _dato(Icons.local_fire_department, const Color(0xFFFF7043),
              '${m.rachaActual}', m.rachaActual == 1 ? 'día seguido' : 'días seguidos'),
          const SizedBox(width: 12),
          _dato(Icons.task_alt, const Color(0xFF43A047),
              '${m.actividadesCompletadas}', 'actividades completadas'),
        ]),
        const SizedBox(height: 24),
        const Text('Mis insignias',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (m.ganadas.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'Completa tu primera actividad para ganar tu primera insignia. ¡Vas a lograrlo!',
              style: TextStyle(fontSize: 16),
            ),
          ),
        for (final b in m.ganadas) _insignia(b, ganada: true),
        if (m.porDescubrir.isNotEmpty) ...[
          const SizedBox(height: 24),
          const Text('Por descubrir',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Sorpresas que te esperan mientras sigues practicando.',
              style: TextStyle(fontSize: 15)),
          const SizedBox(height: 8),
          for (final b in m.porDescubrir) _insignia(b, ganada: false),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi perfil')),
      body: FutureBuilder<MisInsignias>(
        future: _futuro,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      mensajeDeError(snap.error!,
                          porDefecto: 'No pudimos cargar tu perfil.'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _recargar,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: _recargar,
            child: _contenido(snap.data!),
          );
        },
      ),
    );
  }
}
