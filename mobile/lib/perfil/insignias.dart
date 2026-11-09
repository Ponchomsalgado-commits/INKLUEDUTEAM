import 'package:flutter/material.dart';

import '../api_client.dart';

class Insignia {
  final String code;
  final String nombre;
  final String descripcion;
  final String icono;
  final int streakCount;

  const Insignia({
    required this.code,
    required this.nombre,
    required this.descripcion,
    required this.icono,
    this.streakCount = 0,
  });

  factory Insignia.fromJson(Map<String, dynamic> j) => Insignia(
        code: (j['code'] ?? '') as String,
        nombre: (j['name'] ?? '') as String,
        descripcion: (j['description'] ?? '') as String,
        icono: (j['icon'] ?? '') as String,
        streakCount: j['streakCount'] is num ? (j['streakCount'] as num).toInt() : 0,
      );
}

/// Respuesta de GET /students/me/badges.
class MisInsignias {
  final int rachaActual;
  final int actividadesCompletadas;
  final List<Insignia> ganadas;
  final List<Insignia> porDescubrir;

  const MisInsignias({
    required this.rachaActual,
    required this.actividadesCompletadas,
    required this.ganadas,
    required this.porDescubrir,
  });

  static List<Insignia> _lista(Object? v) => [
        for (final e in (v as List? ?? const []))
          if (e is Map) Insignia.fromJson(e.cast<String, dynamic>()),
      ];

  factory MisInsignias.fromJson(Map<String, dynamic> j) => MisInsignias(
        rachaActual: j['rachaActual'] is num ? (j['rachaActual'] as num).toInt() : 0,
        actividadesCompletadas: j['actividadesCompletadas'] is num
            ? (j['actividadesCompletadas'] as num).toInt()
            : 0,
        ganadas: _lista(j['badges']),
        porDescubrir: _lista(j['porDescubrir']),
      );

  static Future<MisInsignias> cargar() async {
    final res = await ApiClient().dio.get('/api/v1/students/me/badges');
    return MisInsignias.fromJson((res.data as Map).cast<String, dynamic>());
  }
}

/// Insignias nuevas o que subieron de nivel respecto a [antes].
/// Devuelve mensajes listos para mostrar.
List<String> logrosNuevos(MisInsignias? antes, MisInsignias despues) {
  final previas = {for (final b in antes?.ganadas ?? const <Insignia>[]) b.code: b.streakCount};
  final mensajes = <String>[];
  for (final b in despues.ganadas) {
    final previo = previas[b.code];
    if (previo == null) {
      mensajes.add('¡Ganaste la insignia ${b.nombre}!');
    } else if (b.streakCount > previo) {
      mensajes.add('¡Tu insignia ${b.nombre} ahora es x${b.streakCount}!');
    }
  }
  return mensajes;
}

IconData iconoDeInsignia(String icono) {
  switch (icono) {
    case 'rocket':
      return Icons.rocket_launch;
    case 'calendar':
      return Icons.event_available;
    case 'clock':
      return Icons.schedule;
    case 'star':
      return Icons.star;
    case 'flame':
      return Icons.local_fire_department;
    default:
      return Icons.emoji_events;
  }
}
