import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'api_client.dart';

class TestScreen extends StatefulWidget {
  const TestScreen({super.key});

  @override
  State<TestScreen> createState() => _TestScreenState();
}

class _TestScreenState extends State<TestScreen> {
  final api = ApiClient();

  bool cargando = false;
  String? error;
  dynamic datos;

  Future<void> probarConexion() async {
    setState(() {
      cargando = true;
      error = null;
    });

    try {
      final respuesta = await api.dio.get('/posts/1'); // cambia por el endpoint real
      setState(() => datos = respuesta.data);
    } on DioException catch (e) {
      setState(() => error = 'Error: ${e.message}');
    } finally {
      setState(() => cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Prueba de conexión')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: probarConexion,
                child: const Text('Probar conexión'),
              ),
              const SizedBox(height: 20),
              if (cargando) const CircularProgressIndicator(),
              if (error != null) Text(error!, style: const TextStyle(color: Colors.red)),
              if (datos != null) Text(datos.toString()),
            ],
          ),
        ),
      ),
    );
  }
}