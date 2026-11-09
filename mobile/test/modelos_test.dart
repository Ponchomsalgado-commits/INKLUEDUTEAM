import 'package:flutter_test/flutter_test.dart';
import 'package:inkledu_mobile/actividades/modelos.dart';
import 'package:inkledu_mobile/perfil/insignias.dart';

void main() {
  group('fechaAmigable', () {
    final ahora = DateTime(2026, 11, 9, 10);

    test('hoy, mañana y ayer', () {
      expect(fechaAmigable(DateTime(2026, 11, 9, 18, 5), ahora: ahora),
          'hoy a las 18:05');
      expect(fechaAmigable(DateTime(2026, 11, 10, 9), ahora: ahora),
          'mañana a las 9:00');
      expect(fechaAmigable(DateTime(2026, 11, 8, 0), ahora: ahora),
          'ayer a las 0:00');
    });

    test('otro día con nombre del día y mes', () {
      expect(fechaAmigable(DateTime(2026, 11, 12, 12, 30), ahora: ahora),
          'jueves 12 de noviembre a las 12:30');
      expect(fechaAmigable(DateTime(2027, 1, 4, 8), ahora: ahora),
          'lunes 4 de enero de 2027 a las 8:00');
    });
  });

  test('textoEstado', () {
    expect(textoEstado(EstadoAsignacion.pendiente, null), 'Pendiente');
    expect(textoEstado(EstadoAsignacion.atrasado, null), 'Atrasada');
    expect(
        textoEstado(EstadoAsignacion.completado,
            const UltimoIntento(score: 2, total: 3)),
        'Completada · 2/3');
  });

  test('preguntasDesdePlay ordena opciones por índice', () {
    final ps = preguntasDesdePlay([
      {
        'id': 'q1',
        'pregunta': '¿2+2?',
        'opciones': [
          {'id': 1, 'texto': '4'},
          {'id': 0, 'texto': '3'},
        ],
      },
    ]);
    expect(ps, hasLength(1));
    expect(ps.first.id, 'q1');
    expect(ps.first.enunciado, '¿2+2?');
    expect(ps.first.opciones, ['3', '4']);
  });

  test('tipoDeMaterial', () {
    expect(tipoDeMaterial('text/plain'), TipoMaterial.texto);
    expect(tipoDeMaterial('video/mp4'), TipoMaterial.video);
    expect(tipoDeMaterial('audio/mpeg'), TipoMaterial.audio);
    expect(tipoDeMaterial('application/pdf'), TipoMaterial.pdf);
  });

  test('logrosNuevos detecta insignias nuevas y que suben', () {
    MisInsignias m(List<Insignia> g) => MisInsignias(
        rachaActual: 0, actividadesCompletadas: 0, ganadas: g, porDescubrir: const []);
    const a1 = Insignia(code: 'racha', nombre: 'En racha', descripcion: '', icono: 'flame', streakCount: 1);
    const a2 = Insignia(code: 'racha', nombre: 'En racha', descripcion: '', icono: 'flame', streakCount: 2);
    const b = Insignia(code: 'constancia_diaria', nombre: 'Al día', descripcion: '', icono: 'calendar', streakCount: 1);
    expect(logrosNuevos(m([a1]), m([a2, b])),
        ['¡Tu insignia En racha ahora es x2!', '¡Ganaste la insignia Al día!']);
    expect(logrosNuevos(m([a1]), m([a1])), isEmpty);
  });
}
