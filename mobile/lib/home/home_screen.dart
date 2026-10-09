import 'package:flutter/material.dart';
import '../api_client.dart';
import '../auth/auth_service.dart';
import '../auth/login_screen.dart';
import '../core/token_storage.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> _cerrarSesion(BuildContext context) async {
    await AuthService(ApiClient(), TokenStorage()).logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (ruta) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          // Provisional: sirve para probar el flujo de sesión
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: () => _cerrarSesion(context),
          ),
        ],
      ),
      body: const Center(
        child: Text(
          'Página principal',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}