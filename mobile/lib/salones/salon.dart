class Salon {
  final String id;
  final String nombre;
  final bool esTutoria; // true = INDIVIDUAL, false = GRUPO

  const Salon({required this.id, required this.nombre, required this.esTutoria});

  factory Salon.fromJson(Map<String, dynamic> json) => Salon(
        id: json['id'] as String,
        nombre: json['name'] as String,
        esTutoria: json['type'] == 'INDIVIDUAL',
      );
}