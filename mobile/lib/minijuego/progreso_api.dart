import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'envio_local.dart';

enum EstadoEnvio {
  exito,
  pendiente,
  rechazado,
  enCurso,
}

class ResultadoEnvio {
  final EstadoEnvio estado;
  final int? score;
  final int? total;
  final String? mensaje;

  const ResultadoEnvio._(this.estado, {this.score, this.total, this.mensaje});

  const ResultadoEnvio.exito({int? score, int? total})
      : this._(EstadoEnvio.exito, score: score, total: total);
  const ResultadoEnvio.pendiente() : this._(EstadoEnvio.pendiente);
  const ResultadoEnvio.rechazado(String mensaje)
      : this._(EstadoEnvio.rechazado, mensaje: mensaje);
  const ResultadoEnvio.enCurso() : this._(EstadoEnvio.enCurso);
}

class ProgresoApi {

  static const _ruta = '/api/v1/progress';

  final Dio _dio;
  final Set<String> _enVuelo = {};
  StreamSubscription<List<ConnectivityResult>>? _sub;

  ProgresoApi._(this._dio);

  static ProgresoApi? _instancia;

  static ProgresoApi get instancia {
    final i = _instancia;
    if (i == null) {
      throw StateError('Llama a ProgresoApi.iniciar(dio) en main() primero.');
    }
    return i;
  }

  static void iniciar(Dio dio) {
    _instancia?._sub?.cancel();
    final api = ProgresoApi._(dio);
    _instancia = api;
    api._sub = Connectivity().onConnectivityChanged.listen((resultados) {
      if (resultados.any((r) => r != ConnectivityResult.none)) {
        api.sincronizarPendientes();
      }
    });
    api.sincronizarPendientes();
  }

  Future<ResultadoEnvio> enviar(String activityId) async {
    final pendiente = await EnvioLocal.leer(activityId);
    if (pendiente == null) {
      return const ResultadoEnvio.rechazado(
          'No hay respuestas guardadas para enviar.');
    }
    if (!_enVuelo.add(activityId)) return const ResultadoEnvio.enCurso();

    try {
      final resp = await _dio.post(_ruta, data: {
        'activityId': activityId,
        'respuestas': pendiente.respuestas.map((r) => r.toJson()).toList(),
        if (pendiente.attemptId != null) 'attemptId': pendiente.attemptId,
      });

      await EnvioLocal.eliminar(activityId);

      final data = resp.data;
      if (data is Map && data['score'] is num && data['total'] is num) {
        return ResultadoEnvio.exito(
          score: (data['score'] as num).toInt(),
          total: (data['total'] as num).toInt(),
        );
      }
      return const ResultadoEnvio.exito();
    } on DioException catch (e) {
      if (_esReintentable(e)) return const ResultadoEnvio.pendiente();
      await EnvioLocal.marcarRechazado(activityId);
      return ResultadoEnvio.rechazado(_mensajeDe(e));
    } catch (e) {
      debugPrint('ProgresoApi.enviar: $e');
      return const ResultadoEnvio.pendiente();
    } finally {
      _enVuelo.remove(activityId);
    }
  }

  Future<void> sincronizarPendientes() async {
    final lista = await EnvioLocal.todos();
    for (final p in lista) {
      if (p.rechazado) continue;
      await enviar(p.activityId);
    }
  }

  bool _esReintentable(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return true;
      default:
        final status = e.response?.statusCode;
        return status == null || status >= 500 || status == 401;
    }
  }

  String _mensajeDe(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    return 'El servidor rechazó el envío (${e.response?.statusCode}).';
  }
}