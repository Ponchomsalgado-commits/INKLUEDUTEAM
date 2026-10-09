import '../api_client.dart';
import '../core/token_storage.dart';

class AuthService {
  final ApiClient api;
  final TokenStorage storage;

  AuthService(this.api, this.storage);

  Future<void> login(String email, String password) async {
    final res = await api.dio.post(
      '/api/v1/auth/login',
      data: {'email': email, 'password': password},
    );
    await storage.saveTokens(
      res.data['access_token'],
      res.data['refresh_token'],
    );
  }

  // OJO: confirmar con tu compañero el valor exacto del rol
    static const rolUsuarioA = 'ESTUDIANTE';

  Future<void> register(String email, String password) async {
    final res = await api.dio.post(
      '/api/v1/auth/registro',
      data: {
        'email': email,
        'password': password,
        'role': rolUsuarioA,
      },
    );
    await storage.saveTokens(
      res.data['access_token'],
      res.data['refresh_token'],
    );
  }
    Future<bool> tieneSesion() async {
    final refresh = await storage.getRefreshToken();
    return refresh != null && refresh.isNotEmpty;
  }

  Future<void> logout() => storage.clear();
}