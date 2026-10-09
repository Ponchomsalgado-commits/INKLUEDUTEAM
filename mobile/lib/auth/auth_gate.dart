import 'package:flutter/material.dart';
import '../api_client.dart';
import '../core/token_storage.dart';
import '../home/home_screen.dart';
import 'auth_service.dart';
import 'login_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final _auth = AuthService(ApiClient(), TokenStorage());
  late final Future<bool> _sesion = _revisar();

  Future<bool> _revisar() async {
    try {
      return await _auth.tieneSesion();
    } catch (_) {
      return false; // si el almacenamiento falla, mejor pedir login
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _sesion,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return snapshot.data == true ? const HomeScreen() : const LoginScreen();
      },
    );
  }
}