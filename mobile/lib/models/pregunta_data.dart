class OpcionData {
  final String texto;
  const OpcionData({required this.texto});

  factory OpcionData.fromJson(Map<String, dynamic> json) =>
      OpcionData(texto: json['texto'] as String);
}

class PreguntaData {
  final String id;
  final String texto;
  final List<OpcionData> opciones;

  const PreguntaData({
    required this.id,
    required this.texto,
    required this.opciones,
  });

  factory PreguntaData.fromJson(Map<String, dynamic> json) => PreguntaData(
        id: json['id'] as String,
        texto: json['pregunta'] as String,
        opciones: (json['opciones'] as List)
            .map((o) => OpcionData.fromJson(o as Map<String, dynamic>))
            .toList(),
      );
}