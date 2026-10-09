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
  static const rolUsuarioA = 'UsuarioA';

  Future<void> register(String email, String password) async {
    await api.dio.post(
      '/api/v1/auth/register',
      data: {
        'email': email,
        'password': password,
        'role': rolUsuarioA,
      },
    );
  }
}