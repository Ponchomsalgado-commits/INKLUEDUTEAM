import 'package:flutter/material.dart';
import 'api_client.dart';
import 'auth/auth_gate.dart';
import 'auth/login_screen.dart';

final navigatorKey = GlobalKey<NavigatorState>();

void main() {
  ApiClient().onSessionExpired = () {
    navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (ruta) => false,
    );
  };

  runApp(MaterialApp(
    navigatorKey: navigatorKey,
    home: const AuthGate(),
  ));
}