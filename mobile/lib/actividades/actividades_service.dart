import 'package:dio/dio.dart';

import '../api_client.dart';
import 'modelos.dart';

/// Detalle de un salón (GET /classrooms/:id).
class SalonDetalle {
  final String id;
  final String nombre;
  final bool esTutoria;
  final String? profesorEmail;

  const SalonDetalle({
    required this.id,
    required this.nombre,
    required this.esTutoria,
    required this.profesorEmail,
  });

  factory SalonDetalle.fromJson(Map<String, dynamic> j) => SalonDetalle(
        id: j['id'] as String,
        nombre: (j['name'] ?? '') as String,
        esTutoria: j['type'] == 'INDIVIDUAL',
        profesorEmail: (j['teacher'] as Map?)?['email'] as String?,
      );
}

class ActividadesService {
  final Dio _dio;
  ActividadesService([Dio? dio]) : _dio = dio ?? ApiClient().dio;

  List<Asignacion> _lista(Object? data) => [
        for (final e in (data as List? ?? const []))
          if (e is Map) Asignacion.fromJson(e.cast<String, dynamic>()),
      ];

  Future<List<Asignacion>> misAsignaciones({String? salonId}) async {
    final res = await _dio.get(
      '/api/v1/assignments/me',
      queryParameters: salonId == null ? null : {'classroomId': salonId},
    );
    return _lista(res.data);
  }

  Future<List<Asignacion>> asignacionesDeSalon(String salonId) async {
    final res = await _dio.get('/api/v1/classrooms/$salonId/assignments');
    return _lista(res.data);
  }

  Future<SalonDetalle> salon(String salonId) async {
    final res = await _dio.get('/api/v1/classrooms/$salonId');
    return SalonDetalle.fromJson((res.data as Map).cast<String, dynamic>());
  }

  Future<ActividadPlay> play(String actividadId) async {
    final res = await _dio.get('/api/v1/activities/$actividadId/play');
    return ActividadPlay.fromJson((res.data as Map).cast<String, dynamic>());
  }
}

/// Mensaje amable para errores de red o del servidor.
String mensajeDeError(Object e, {String porDefecto = 'Algo salió mal.'}) {
  if (e is DioException) {
    if (e.response == null) return 'Sin conexión. Revisa tu internet.';
    switch (e.response!.statusCode) {
      case 403:
        return 'No tienes acceso a este salón.';
      case 404:
        return 'No encontramos esta actividad.';
    }
  }
  return porDefecto;
}
