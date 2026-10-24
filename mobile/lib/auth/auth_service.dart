import 'dart:convert';

import '../api_client.dart';
import '../core/token_storage.dart';

/// La cuenta existe pero no es de estudiante (la app móvil es solo para usuarioA).
class RolNoPermitidoException implements Exception {}

/// Registro, login y logout contra /api/v1/auth. Guarda los tokens en [TokenStorage].
class AuthService {
  /// Rol que usa la app móvil (enum Role del backend).
  static const rolUsuarioA = 'ESTUDIANTE';

  /// Debe coincidir con PASSWORD_MIN_LENGTH del backend.
  static const passwordMinLength = 8;

  final ApiClient api;
  final TokenStorage storage;

  AuthService(this.api, this.storage);

  Future<void> login(String email, String password) async {
    final res = await api.dio.post(
      '/api/v1/auth/login',
      data: {'email': email, 'password': password},
    );
    await _guardarSesion(res.data);
  }

  Future<void> register(String email, String password) async {
    final res = await api.dio.post(
      '/api/v1/auth/registro',
      data: {'email': email, 'password': password, 'role': rolUsuarioA},
    );
    await _guardarSesion(res.data);
  }

  /// Hay sesión si existe un refresh token; si ya no sirve, el primer 401 manda al login.
  Future<bool> tieneSesion() async {
    final refresh = await storage.getRefreshToken();
    return refresh != null && refresh.isNotEmpty;
  }

  Future<void> logout() => storage.clear();

  Future<void> _guardarSesion(Map<String, dynamic> data) async {
    final access = data['access_token'] as String;
    if (_rolDelToken(access) != rolUsuarioA) {
      throw RolNoPermitidoException();
    }
    await storage.saveTokens(access, data['refresh_token'] as String);
  }

  /// Lee el rol del payload del JWT (solo para la interfaz; el backend valida el rol).
  String? _rolDelToken(String token) {
    try {
      final payload = base64Url.normalize(token.split('.')[1]);
      return jsonDecode(utf8.decode(base64Url.decode(payload)))['role']
          as String?;
    } catch (_) {
      return null;
    }
  }
}
