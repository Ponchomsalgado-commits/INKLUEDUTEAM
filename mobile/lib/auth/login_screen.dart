import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../api_client.dart';
import '../core/token_storage.dart';
import 'auth_service.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _auth = AuthService(ApiClient(), TokenStorage());
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  bool _cargando = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _iniciarSesion() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;

    // 1. Validar antes de molestar al backend
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Escribe tu correo y tu contraseña.');
      return;
    }

    // 2. Estado: cargando
    setState(() {
      _cargando = true;
      _error = null;
    });

    // 3. Llamar al backend
    try {
      await _auth.login(email, pass);
      if (!mounted) return;
      // TODO: navegar a la pantalla principal cuando exista
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('¡Listo! Sesión iniciada.')),
      );
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() => _error = _mensajeDeError(e));
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Algo salió mal. Intenta de nuevo.');
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  String _mensajeDeError(DioException e) {
    final codigo = e.response?.statusCode;
    if (codigo == 401) return 'Correo o contraseña incorrectos.';
    if (codigo == 400) return 'Revisa que tu correo esté bien escrito.';
    if (codigo == null) return 'No pudimos conectar. Intenta de nuevo.';
    return 'Algo salió mal. Intenta de nuevo.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Iniciar sesión',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 32),
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Correo',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passCtrl,
                  obscureText: true,
                  onSubmitted: (_) => _iniciarSesion(),
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red, fontSize: 16),
                    ),
                  ),
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _cargando ? null : _iniciarSesion,
                    child: _cargando
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(strokeWidth: 3),
                          )
                        : const Text('Entrar', style: TextStyle(fontSize: 18)),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () async {
                    final creada = await Navigator.push<bool>(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const RegisterScreen(),
                      ),
                    );
                    if (creada == true && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Cuenta creada. Ya puedes iniciar sesión.'),
                        ),
                      );
                    }
                  },
                  child: const Text('Crear cuenta'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

//textbutton