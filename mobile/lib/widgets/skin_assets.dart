class SkinAssets {
  static const Set<String> skinsConocidos = {
    'rana_nenufar',
    'mariposa_flor',
  };

  final bool esReserva;
  final String skin;

  const SkinAssets._(this.skin, this.esReserva);

  factory SkinAssets(String? skinRecibido) {
    final conocido =
        skinRecibido != null && skinsConocidos.contains(skinRecibido);
    return conocido
        ? SkinAssets._(skinRecibido, false)
        : const SkinAssets._('generico', true);
  }

  String get _base => 'assets/minigames/$skin';

  String get fondo => '$_base/fondo.png';
  String get personaje => '$_base/personaje.png';
  String get objetivo => '$_base/objetivo.png';
  String get sonidoAcierto => '$_base/sonido_acierto.mp3';
}