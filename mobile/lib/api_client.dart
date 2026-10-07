//cd mobile (correr primero este en la terminal)
//flutter pub add dio (correr esto de segundo en la terminal)
import 'package:dio/dio.dart';

class ApiClient {
  final Dio dio;

  ApiClient()
      : dio = Dio(
          BaseOptions(
            //la url depende donde o en q app se corra, osea q, pues si w nmms
            //si es emulador Android: http://numeros raros q no c q son (ej. 10.0.2.2):puerto
            //si es simulador iOS: http://localhost:puerto
            //si es celular fisico: http://ip de la pc:puerto
            baseUrl: 'http://localhost:3000',
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
            headers: {'Content-Type': 'application/json'},
          ),
        );
}

/*el dio es mejor q el http porque permite configurar una url base una sola vez,
tambien timeouts, headers e interceptores y con http se tendria q repetir
la url completa en cada peticion*/