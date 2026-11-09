import 'package:flutter/material.dart';
import 'api_client.dart';
import 'auth/auth_gate.dart';
import 'auth/login_screen.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'minijuego/progreso_api.dart';

final navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async{
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  ApiClient().onSessionExpired = () {
    navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (ruta) => false,
    );
  };

  ProgresoApi.iniciar(ApiClient().dio);

  runApp(MaterialApp(navigatorKey: navigatorKey, home: const AuthGate()));
}
