import 'package:flutter/material.dart';
import '../api_client.dart';
import '../auth/auth_service.dart';
import '../auth/login_screen.dart';
import '../core/token_storage.dart';
import '../salones/mis_salones_screen.dart';

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
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
        children: [
            const Text(
             'Pagina Principal',
             style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
  onPressed: () => Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => const MisSalonesScreen()),
  ),
  child: const Text('Mis salones'),
),
     ],
        ),
      ),
    );
  }
}
   
   




