import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

class RespuestaEnvio {
  final String preguntaId;
  final int opcionId;

  const RespuestaEnvio(this.preguntaId, this.opcionId);

  Map<String, dynamic> toJson() => {
        'preguntaId': preguntaId,
        'opcionId': opcionId,
      };
}

class EnvioPendiente {
  final String activityId;
  final List<RespuestaEnvio> respuestas;

  final bool rechazado;

  const EnvioPendiente({
    required this.activityId,
    required this.respuestas,
    this.rechazado = false,
  });
}

class EnvioLocal {
  static const _nombreCaja = 'envios_pendientes';

  static Future<Box> _caja() => Hive.openBox(_nombreCaja);

  static Future<void> guardar(
    String activityId,
    List<RespuestaEnvio> respuestas,
  ) async {
    try {
      final caja = await _caja();
      await caja.put(activityId, {
        'activityId': activityId,
        'respuestas': respuestas.map((r) => r.toJson()).toList(),
        'rechazado': false,
      });
    } catch (e) {
      debugPrint('EnvioLocal.guardar: $e');
    }
  }

  static Future<EnvioPendiente?> leer(String activityId) async {
    try {
      final caja = await _caja();
      return _desdeMapa(caja.get(activityId));
    } catch (e) {
      debugPrint('EnvioLocal.leer: $e');
      return null;
    }
  }

  static Future<List<EnvioPendiente>> todos() async {
    try {
      final caja = await _caja();
      return caja.values
          .map(_desdeMapa)
          .whereType<EnvioPendiente>()
          .toList();
    } catch (e) {
      debugPrint('EnvioLocal.todos: $e');
      return [];
    }
  }

  static Future<void> marcarRechazado(String activityId) async {
    try {
      final caja = await _caja();
      final datos = caja.get(activityId);
      if (datos is! Map) return;
      await caja.put(activityId, {...datos, 'rechazado': true});
    } catch (e) {
      debugPrint('EnvioLocal.marcarRechazado: $e');
    }
  }

  static Future<void> eliminar(String activityId) async {
    try {
      final caja = await _caja();
      await caja.delete(activityId);
    } catch (e) {
      debugPrint('EnvioLocal.eliminar: $e');
    }
  }

  static EnvioPendiente? _desdeMapa(dynamic datos) {
    if (datos is! Map) return null;
    final lista = datos['respuestas'];
    if (lista is! List) return null;
    return EnvioPendiente(
      activityId: datos['activityId'] as String,
      respuestas: lista
          .whereType<Map>()
          .map((r) => RespuestaEnvio(
                r['preguntaId'] as String,
                r['opcionId'] as int,
              ))
          .toList(),
      rechazado: datos['rechazado'] == true,
    );
  }
}