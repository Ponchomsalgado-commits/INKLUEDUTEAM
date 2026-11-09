import 'package:flutter/material.dart';
import '../actividades/bandeja_screen.dart';
import '../api_client.dart';
import '../auth/auth_service.dart';
import '../auth/login_screen.dart';
import '../core/token_storage.dart';
import '../perfil/perfil_screen.dart';
import '../salones/mis_salones_screen.dart';
import '../salones/unirme_salon_screen.dart';

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

  void _ir(BuildContext context, Widget pantalla) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => pantalla));
  }

  Widget _boton(
    BuildContext context, {
    required IconData icono,
    required String texto,
    required Color color,
    required Widget pantalla,
  }) {
    return Card(
      color: color.withValues(alpha: 0.12),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => _ir(context, pantalla),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
          child: Row(
            children: [
              Icon(icono, size: 36, color: color),
              const SizedBox(width: 16),
              Expanded(
                child: Text(texto,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w600)),
              ),
              const Icon(Icons.chevron_right, size: 28),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('INKLUEDU'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: () => _cerrarSesion(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  '¡Hola! ¿Qué hacemos hoy?',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                _boton(context,
                    icono: Icons.assignment,
                    texto: 'Mis actividades',
                    color: Colors.indigo,
                    pantalla: const BandejaScreen()),
                const SizedBox(height: 12),
                _boton(context,
                    icono: Icons.groups,
                    texto: 'Mis salones',
                    color: Colors.teal,
                    pantalla: const MisSalonesScreen()),
                const SizedBox(height: 12),
                _boton(context,
                    icono: Icons.emoji_events,
                    texto: 'Mi perfil',
                    color: Colors.orange,
                    pantalla: const PerfilScreen()),
                const SizedBox(height: 12),
                _boton(context,
                    icono: Icons.group_add,
                    texto: 'Unirme a un salón',
                    color: Colors.purple,
                    pantalla: const UnirmeSalonScreen()),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
