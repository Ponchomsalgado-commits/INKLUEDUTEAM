	import 'package:hive_flutter/hive_flutter.dart';


class ProgresoGuardado {
  final int actual;
  final List<int?> respuestas;

  const ProgresoGuardado({required this.actual, required this.respuestas});
}

class ProgresoLocal {
  static const _nombreCaja = 'progreso_minijuego';
  static String _clave(String id) => 'minijuego_$id';

 


  static Future<ProgresoGuardado?> leer(String id, int totalPreguntas) async {
    if (totalPreguntas == 0) return null;
    try {
      final caja = await Hive.openBox(_nombreCaja);
      final datos = caja.get(_clave(id));
      if (datos is! Map) return null;

      final guardadas = datos['respuestas'];
      if (guardadas is! List || guardadas.length != totalPreguntas) {
        return null;
      }

      final respuestas = guardadas
          .map<int?>((v) => (v is int && v >= 0) ? v : null)
          .toList();

      // Si no viene 'actual', se retoma en la primera sin responder
      final pendiente = respuestas.indexOf(null);
      final porDefecto = pendiente == -1 ? totalPreguntas - 1 : pendiente;
      final actualGuardado = datos['actual'];
      final actual = (actualGuardado is int &&
              actualGuardado >= 0 &&
              actualGuardado < totalPreguntas)
          ? actualGuardado
          : porDefecto;

      return ProgresoGuardado(actual: actual, respuestas: respuestas);
    } catch (_) {
      return null;
    }
  }



  static Future<void> guardar(
    String id,
    int actual,
    List<int?> respuestas,
  ) async {
    try {
      final caja = await Hive.openBox(_nombreCaja);
      await caja.put(_clave(id), {
        'actual': actual,
        'respuestas': respuestas.map((r) => r ?? -1).toList(),
      });
    } catch (_) {}
  }

  static Future<void> borrar(String id) async {
    try {
      final caja = await Hive.openBox(_nombreCaja);
      await caja.delete(_clave(id));
    } catch (_) {}
  }
}
