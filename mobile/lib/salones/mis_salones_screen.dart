import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../api_client.dart';
import 'salon.dart';
import 'salones_service.dart';
import 'unirme_salon_screen.dart';

class MisSalonesScreen extends StatefulWidget {
  const MisSalonesScreen({super.key});

  @override
  State<MisSalonesScreen> createState() => _MisSalonesScreenState();
}

class _MisSalonesScreenState extends State<MisSalonesScreen> {
  final _service = SalonesService(ApiClient());
  late Future<List<Salon>> _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = _service.misSalones();
  }

  void _recargar() {
    setState(() => _futuro = _service.misSalones());
  }

  String _mensajeDeError(Object e) {
    if (e is DioException) {
      if (e.response == null) return 'Sin conexión. Revisa tu internet.';
      if (e.response!.statusCode == 404) {
        return 'Esta función aún no está lista.';
      }
    }
    return 'No pudimos cargar tus salones.';
  }

  Future<void> _irAUnirme() async {
    final seUnio = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const UnirmeSalonScreen()),
    );
    if (seUnio == true) _recargar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mis salones')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _irAUnirme,
        icon: const Icon(Icons.add),
        label: const Text('Unirme'),
      ),
      body: FutureBuilder<List<Salon>>(
        future: _futuro,
        builder: (context, snap) {
          // 1. Cargando
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          // 2. Error
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_mensajeDeError(snap.error!),
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 18)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _recargar,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            );
          }
          // 3. Vacío
          final salones = snap.data!;
          if (salones.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Aún no estás en ningún salón.\nToca "Unirme" y escribe el código de tu profesor.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18),
                ),
              ),
            );
          }
          // Lista
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: salones.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final s = salones[i];
              return Card(
                child: ListTile(
                  leading: Icon(s.esTutoria ? Icons.person : Icons.groups),
                  title: Text(s.nombre,
                      style: const TextStyle(fontSize: 18)),
                  subtitle: Text(s.esTutoria ? 'Tutoría' : 'Salón'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}