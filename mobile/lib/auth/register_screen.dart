import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../api_client.dart';
import '../core/token_storage.dart';
import 'auth_service.dart';
import '../home/home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _auth = AuthService(ApiClient(), TokenStorage());
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _cargando = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  // Devuelve un mensaje si algo está mal, o null si todo está bien
  String? _validar(String email, String pass, String confirm) {
    if (email.isEmpty || pass.isEmpty || confirm.isEmpty) {
      return 'Completa todos los campos.';
    }
    if (!email.contains('@')) {
      return 'Revisa que tu correo esté bien escrito.';
    }
    if (pass.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (pass != confirm) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }

  Future<void> _registrar() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;
    final confirm = _confirmCtrl.text;

    final problema = _validar(email, pass, confirm);
    if (problema != null) {
      setState(() => _error = problema);
      return;
    }

    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      await _auth.register(email, pass);
      if (!mounted) return;
      // Regresa al login avisando que todo salió bien _mensajeDeError
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (ruta) => false,
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
    if (codigo == 404) return 'Este servicio todavía no está disponible.';
    if (codigo == 409) return 'Ese correo ya tiene una cuenta.';
    if (codigo == 400) return 'Revisa tus datos e intenta de nuevo.';
    if (codigo == null) return 'No pudimos conectar. Intenta de nuevo.';
    return 'Algo salió mal. Intenta de nuevo.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Crear cuenta',
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
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    helperText: 'Mínimo 8 caracteres',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _confirmCtrl,
                  obscureText: true,
                  onSubmitted: (_) => _registrar(),
                  decoration: const InputDecoration(
                    labelText: 'Confirmar contraseña',
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
                    onPressed: _cargando ? null : _registrar,
                    child: _cargando
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(strokeWidth: 3),
                          )
                        : const Text('Registrarme',
                            style: TextStyle(fontSize: 18)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

//navigator.pop