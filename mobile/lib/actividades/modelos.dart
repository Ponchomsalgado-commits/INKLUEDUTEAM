import '../minijuego/minijuego_screen.dart' show Pregunta;

/// Estado de una actividad asignada, tal como lo calcula el backend.
enum EstadoAsignacion { pendiente, completado, atrasado }

EstadoAsignacion estadoDesdeTexto(String? s) {
  switch (s) {
    case 'completado':
      return EstadoAsignacion.completado;
    case 'atrasado':
      return EstadoAsignacion.atrasado;
    default:
      return EstadoAsignacion.pendiente;
  }
}

DateTime? _fecha(Object? v) =>
    v is String ? DateTime.tryParse(v)?.toLocal() : null;

int _entero(Object? v) => v is num ? v.toInt() : 0;

class UltimoIntento {
  final int score;
  final int total;
  final DateTime? enviadoEn;

  const UltimoIntento({required this.score, required this.total, this.enviadoEn});

  factory UltimoIntento.fromJson(Map<String, dynamic> j) => UltimoIntento(
        score: _entero(j['score']),
        total: _entero(j['total']),
        enviadoEn: _fecha(j['submittedAt']),
      );
}

/// Una actividad asignada en un salón (GET /assignments/me).
class Asignacion {
  final String id;
  final DateTime? fechaLimite;
  final String salonId;
  final String salonNombre;
  final bool esTutoria;
  final String actividadId;
  final String titulo;
  final String type;
  final String? skin;
  final int totalPreguntas;
  final int mediaCount;
  final EstadoAsignacion estado;
  final UltimoIntento? ultimoIntento;

  const Asignacion({
    required this.id,
    required this.fechaLimite,
    required this.salonId,
    required this.salonNombre,
    required this.esTutoria,
    required this.actividadId,
    required this.titulo,
    required this.type,
    required this.skin,
    required this.totalPreguntas,
    required this.mediaCount,
    required this.estado,
    required this.ultimoIntento,
  });

  factory Asignacion.fromJson(Map<String, dynamic> j) {
    final salon = (j['classroom'] as Map?)?.cast<String, dynamic>() ?? {};
    final act = (j['activity'] as Map?)?.cast<String, dynamic>() ?? {};
    final intento = j['ultimoIntento'];
    return Asignacion(
      id: j['id'] as String,
      fechaLimite: _fecha(j['dueDate']),
      salonId: (salon['id'] ?? '') as String,
      salonNombre: (salon['name'] ?? '') as String,
      esTutoria: salon['type'] == 'INDIVIDUAL',
      actividadId: (act['id'] ?? '') as String,
      titulo: (act['title'] ?? 'Actividad') as String,
      type: (act['type'] ?? '') as String,
      skin: act['skin'] as String?,
      totalPreguntas: _entero(act['totalPreguntas']),
      mediaCount: _entero(act['mediaCount']),
      estado: estadoDesdeTexto(j['estado'] as String?),
      ultimoIntento: intento is Map
          ? UltimoIntento.fromJson(intento.cast<String, dynamic>())
          : null,
    );
  }
}

enum TipoMaterial { texto, video, audio, pdf, otro }

/// Material de apoyo (texto, video, audio o PDF) con URL firmada.
class MaterialItem {
  final String nombre;
  final String contentType;
  final String url;

  const MaterialItem({
    required this.nombre,
    required this.contentType,
    required this.url,
  });

  TipoMaterial get tipo => tipoDeMaterial(contentType);

  factory MaterialItem.fromJson(Map<String, dynamic> j) => MaterialItem(
        nombre: (j['name'] ?? 'Material') as String,
        contentType: (j['contentType'] ?? '') as String,
        url: (j['url'] ?? '') as String,
      );
}

TipoMaterial tipoDeMaterial(String contentType) {
  final ct = contentType.toLowerCase();
  if (ct.startsWith('text/')) return TipoMaterial.texto;
  if (ct.startsWith('video/')) return TipoMaterial.video;
  if (ct.startsWith('audio/')) return TipoMaterial.audio;
  if (ct == 'application/pdf') return TipoMaterial.pdf;
  return TipoMaterial.otro;
}

/// Datos para jugar una actividad (GET /activities/:id/play).
class ActividadPlay {
  final String actividadId;
  final String titulo;
  final String type;
  final String? skin;
  final List<Pregunta> preguntas;
  final List<MaterialItem> materiales;

  const ActividadPlay({
    required this.actividadId,
    required this.titulo,
    required this.type,
    required this.skin,
    required this.preguntas,
    required this.materiales,
  });

  factory ActividadPlay.fromJson(Map<String, dynamic> j) => ActividadPlay(
        actividadId: j['activityId'] as String,
        titulo: (j['title'] ?? 'Actividad') as String,
        type: (j['type'] ?? '') as String,
        skin: j['skin'] as String?,
        preguntas: preguntasDesdePlay(j['preguntas']),
        materiales: [
          for (final m in (j['media'] as List? ?? const []))
            if (m is Map) MaterialItem.fromJson(m.cast<String, dynamic>()),
        ],
      );
}

/// Convierte las preguntas del backend al modelo del minijuego.
/// El backend identifica cada opción por su índice ("id"); se ordenan por
/// ese índice para que la posición en la lista sea el opcionId que se envía.
List<Pregunta> preguntasDesdePlay(Object? lista) {
  if (lista is! List) return const [];
  return [
    for (final p in lista)
      if (p is Map)
        Pregunta(
          id: p['id'] as String,
          enunciado: (p['pregunta'] ?? '') as String,
          opciones: () {
            final ops = [
              for (final o in (p['opciones'] as List? ?? const []))
                if (o is Map) o,
            ]..sort((a, b) => _entero(a['id']).compareTo(_entero(b['id'])));
            return [for (final o in ops) (o['texto'] ?? '').toString()];
          }(),
        ),
  ];
}

const _meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const _dias = [
  'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
];

/// Fecha límite en español amigable: "hoy", "mañana", "ayer" o
/// "jueves 12 de noviembre" (con hora si no es medianoche).
String fechaAmigable(DateTime fecha, {DateTime? ahora}) {
  final hoy = ahora ?? DateTime.now();
  final d0 = DateTime(hoy.year, hoy.month, hoy.day);
  final d1 = DateTime(fecha.year, fecha.month, fecha.day);
  final dif = d1.difference(d0).inDays;
  final hora = '${fecha.hour}:${fecha.minute.toString().padLeft(2, '0')}';

  String dia;
  if (dif == 0) {
    dia = 'hoy';
  } else if (dif == 1) {
    dia = 'mañana';
  } else if (dif == -1) {
    dia = 'ayer';
  } else {
    dia = '${_dias[fecha.weekday - 1]} ${fecha.day} de ${_meses[fecha.month - 1]}';
    if (fecha.year != hoy.year) dia += ' de ${fecha.year}';
  }
  return '$dia a las $hora';
}

/// Texto corto del estado para el chip.
String textoEstado(EstadoAsignacion e, UltimoIntento? intento) {
  switch (e) {
    case EstadoAsignacion.completado:
      return intento != null
          ? 'Completada · ${intento.score}/${intento.total}'
          : 'Completada';
    case EstadoAsignacion.atrasado:
      return 'Atrasada';
    case EstadoAsignacion.pendiente:
      return 'Pendiente';
  }
}
