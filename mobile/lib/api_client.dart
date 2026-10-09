import 'package:dio/dio.dart';
import 'core/token_storage.dart';

class ApiClient {
  // Singleton: ApiClient() siempre devuelve la misma instancia
  static final ApiClient _instance = ApiClient._interno();
  factory ApiClient() => _instance;

  // Emulador Android: http://10.0.2.2:3000
  // Chrome / iOS: http://localhost:3000
  // Celular físico: http://IP_DE_TU_PC:3000
  static const _baseUrl = 'http://localhost:3000';

  // Rutas donde NO se manda token ni se intenta refrescar
  static const _rutasPublicas = ['/auth/login', '/auth/registro', '/auth/refrescar'];

  final TokenStorage _storage = TokenStorage();
  final Dio dio;
  final Dio _refreshDio; // sin interceptor, solo para pedir el refresh
  Future<bool>? _refrescando;

  /// Se llama cuando la sesión ya no se puede renovar (lo asigna main.dart)
  void Function()? onSessionExpired;

  static BaseOptions _opciones() => BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Content-Type': 'application/json'},
      );

  ApiClient._interno()
      : dio = Dio(_opciones()),
        _refreshDio = Dio(_opciones()) {
    dio.interceptors.add(
      InterceptorsWrapper(onRequest: _alEnviar, onError: _alFallar),
    );
  }

  bool _esPublica(String path) => _rutasPublicas.any(path.contains);

  // 1) Antes de enviar: agrega el token
  Future<void> _alEnviar(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_esPublica(options.path)) {
      final token = await _storage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  // 2) Si falla: ¿es un 401 por token vencido?
  Future<void> _alFallar(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final peticion = error.requestOptions;
    final esToken401 = error.response?.statusCode == 401;

    // Si no aplica, el error sigue su camino normal
    if (!esToken401 ||
        _esPublica(peticion.path) ||
        peticion.extra['reintentado'] == true) {
      return handler.next(error);
    }

    bool renovado;
    try {
      renovado = await _refrescarToken();
    } on DioException {
      // Sin red: no cerramos la sesión, solo devolvemos el error original
      return handler.next(error);
    }

    if (!renovado) {
      await _storage.clear();
      onSessionExpired?.call();
      return handler.next(error);
    }

    // Repite la petición original (onRequest le pondrá el token nuevo)
    try {
      peticion.extra['reintentado'] = true;
      final respuesta = await dio.fetch(peticion);
      handler.resolve(respuesta);
    } on DioException catch (e) {
      handler.next(e);
    }
  }

  // Si ya hay un refresh en curso, todos esperan el mismo
  Future<bool> _refrescarToken() {
    _refrescando ??= _hacerRefresh().whenComplete(() => _refrescando = null);
    return _refrescando!;
  }

  Future<bool> _hacerRefresh() async {
    final refresh = await _storage.getRefreshToken();
    if (refresh == null) return false;

    try {
      final res = await _refreshDio.post(
        '/api/v1/auth/refrescar',
        data: {'refresh_token': refresh},
      );
      await _storage.saveTokens(
        res.data['access_token'],
        res.data['refresh_token'] ?? refresh, // por si no rota el refresh
      );
      return true;
    } on DioException catch (e) {
      if (e.response == null) rethrow; // problema de red
      return false; // el servidor rechazó el refresh
    } catch (_) {
      return false;
    }
  }
}

//static