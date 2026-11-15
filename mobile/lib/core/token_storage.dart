import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive/hive.dart';

/// Guarda los tokens de sesión.
/// - Android / iOS: almacenamiento seguro del sistema (Keystore / Keychain).
/// - Web: caja de Hive (IndexedDB). flutter_secure_storage en web necesita
///   `crypto.subtle`, que el navegador solo da en HTTPS o localhost; al abrir la
///   app por IP en la red local (http://192.168.x.x) fallaba al guardar el login.
class TokenStorage {
  static const _cajaWeb = 'sesion';
  static const _kAccess = 'access_token';
  static const _kRefresh = 'refresh_token';

  final _seguro = const FlutterSecureStorage();

  Future<Box> _caja() => Hive.openBox(_cajaWeb);

  Future<void> _escribir(String clave, String valor) async {
    if (kIsWeb) return (await _caja()).put(clave, valor);
    return _seguro.write(key: clave, value: valor);
  }

  Future<String?> _leer(String clave) async {
    if (kIsWeb) return (await _caja()).get(clave) as String?;
    return _seguro.read(key: clave);
  }

  Future<void> saveTokens(String access, String refresh) async {
    await _escribir(_kAccess, access);
    await _escribir(_kRefresh, refresh);
  }

  Future<String?> getAccessToken() => _leer(_kAccess);
  Future<String?> getRefreshToken() => _leer(_kRefresh);

  Future<void> clear() async {
    if (kIsWeb) {
      await (await _caja()).clear();
      return;
    }
    await _seguro.deleteAll();
  }
}
