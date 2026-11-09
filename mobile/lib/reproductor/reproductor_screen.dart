import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:video_player/video_player.dart';

import '../actividades/modelos.dart';

/// Muestra un material de apoyo: texto (con lectura en voz alta),
/// video o audio. La URL es firmada (MinIO), por eso se usa un Dio sin token.
class ReproductorScreen extends StatelessWidget {
  final MaterialItem material;
  const ReproductorScreen({super.key, required this.material});

  @override
  Widget build(BuildContext context) {
    final Widget cuerpo;
    switch (material.tipo) {
      case TipoMaterial.texto:
        cuerpo = _VistaTexto(url: material.url);
      case TipoMaterial.video:
        cuerpo = _VistaVideo(url: material.url);
      case TipoMaterial.audio:
        cuerpo = _VistaAudio(url: material.url, nombre: material.nombre);
      case TipoMaterial.pdf:
      case TipoMaterial.otro:
        cuerpo = const _Aviso(
            'Este archivo se abre fuera de la app desde el menú de la actividad.');
    }
    return Scaffold(
      appBar: AppBar(title: Text(material.nombre)),
      body: SafeArea(child: cuerpo),
    );
  }
}

class _Aviso extends StatelessWidget {
  final String texto;
  final VoidCallback? reintentar;
  const _Aviso(this.texto, {this.reintentar});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, size: 56, color: Colors.blueGrey),
              const SizedBox(height: 12),
              Text(texto,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 18)),
              if (reintentar != null) ...[
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: reintentar,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Reintentar'),
                ),
              ],
            ],
          ),
        ),
      );
}

// ---------------- Texto ----------------

class _VistaTexto extends StatefulWidget {
  final String url;
  const _VistaTexto({required this.url});

  @override
  State<_VistaTexto> createState() => _VistaTextoState();
}

class _VistaTextoState extends State<_VistaTexto> {
  final FlutterTts _tts = FlutterTts();
  String? _texto;
  bool _error = false;
  bool _hablando = false;

  @override
  void initState() {
    super.initState();
    _cargar();
    _iniciarTts();
  }

  Future<void> _cargar() async {
    setState(() {
      _error = false;
      _texto = null;
    });
    try {
      final res = await Dio().get<List<int>>(
        widget.url,
        options: Options(responseType: ResponseType.bytes),
      );
      final texto = utf8.decode(res.data ?? const [], allowMalformed: true);
      if (mounted) {
        setState(() {
          _texto = texto;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = true;
        });
      }
    }
  }

  Future<void> _iniciarTts() async {
    try {
      await _tts.setLanguage('es-MX');
      await _tts.setSpeechRate(0.5);
      void fin() {
        if (mounted) {
          setState(() {
            _hablando = false;
          });
        }
      }
      _tts.setCompletionHandler(fin);
      _tts.setCancelHandler(fin);
      _tts.setErrorHandler((_) => fin());
    } catch (_) {
      // Sin lector de voz disponible: el texto se puede leer igual
    }
  }

  Future<void> _alternarVoz() async {
    if (_hablando) {
      await _tts.stop();
      if (mounted) {
        setState(() {
          _hablando = false;
        });
      }
      return;
    }
    setState(() {
      _hablando = true;
    });
    await _tts.speak(_texto ?? '');
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error) {
      return _Aviso('No pudimos cargar la lectura.', reintentar: _cargar);
    }
    final texto = _texto;
    if (texto == null) return const Center(child: CircularProgressIndicator());

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: FilledButton.tonalIcon(
            onPressed: _alternarVoz,
            icon: Icon(_hablando ? Icons.stop : Icons.volume_up),
            label: Text(_hablando ? 'Detener lectura' : 'Leer en voz alta'),
          ),
        ),
        const SizedBox(height: 20),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: SelectableText(
            texto.trim().isEmpty ? 'Este material está vacío.' : texto,
            style: const TextStyle(fontSize: 20, height: 1.7),
          ),
        ),
      ],
    );
  }
}

// ---------------- Video ----------------

class _VistaVideo extends StatefulWidget {
  final String url;
  const _VistaVideo({required this.url});

  @override
  State<_VistaVideo> createState() => _VistaVideoState();
}

class _VistaVideoState extends State<_VistaVideo> {
  late final VideoPlayerController _video =
      VideoPlayerController.networkUrl(Uri.parse(widget.url));
  bool _listo = false;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _iniciar();
  }

  Future<void> _iniciar() async {
    try {
      await _video.initialize();
      _video.addListener(_alCambiar);
      if (mounted) {
        setState(() {
          _listo = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = true;
        });
      }
    }
  }

  void _alCambiar() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _video.removeListener(_alCambiar);
    _video.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error) return const _Aviso('No pudimos cargar el video.');
    if (!_listo) return const Center(child: CircularProgressIndicator());

    final terminado = _video.value.position >= _video.value.duration &&
        !_video.value.isPlaying;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AspectRatio(
            aspectRatio: _video.value.aspectRatio,
            child: VideoPlayer(_video),
          ),
        ),
        const SizedBox(height: 12),
        VideoProgressIndicator(_video, allowScrubbing: true),
        const SizedBox(height: 8),
        Center(
          child: IconButton(
            iconSize: 64,
            tooltip: _video.value.isPlaying ? 'Pausar' : 'Reproducir',
            onPressed: () async {
              if (_video.value.isPlaying) {
                await _video.pause();
              } else {
                if (terminado) await _video.seekTo(Duration.zero);
                await _video.play();
              }
            },
            icon: Icon(_video.value.isPlaying
                ? Icons.pause_circle
                : Icons.play_circle),
          ),
        ),
      ],
    );
  }
}

// ---------------- Audio ----------------

class _VistaAudio extends StatefulWidget {
  final String url;
  final String nombre;
  const _VistaAudio({required this.url, required this.nombre});

  @override
  State<_VistaAudio> createState() => _VistaAudioState();
}

class _VistaAudioState extends State<_VistaAudio> {
  final AudioPlayer _audio = AudioPlayer();
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _iniciar();
  }

  Future<void> _iniciar() async {
    try {
      await _audio.setUrl(widget.url);
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = true;
        });
      }
    }
  }

  Future<void> _alternar() async {
    if (_audio.playing &&
        _audio.processingState != ProcessingState.completed) {
      await _audio.pause();
      return;
    }
    if (_audio.processingState == ProcessingState.completed) {
      await _audio.seek(Duration.zero);
    }
    _audio.play();
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  void dispose() {
    _audio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error) return const _Aviso('No pudimos cargar el audio.');

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.headphones, size: 80, color: Colors.indigo),
            const SizedBox(height: 16),
            Text(widget.nombre,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 16),
            StreamBuilder<PlayerState>(
              stream: _audio.playerStateStream,
              builder: (context, snap) {
                final estado = snap.data?.processingState;
                final sonando = (snap.data?.playing ?? false) &&
                    estado != ProcessingState.completed;
                final cargando = estado == ProcessingState.loading ||
                    estado == ProcessingState.buffering;
                return IconButton(
                  iconSize: 72,
                  tooltip: sonando ? 'Pausar' : 'Reproducir',
                  onPressed: cargando ? null : _alternar,
                  icon: Icon(sonando ? Icons.pause_circle : Icons.play_circle),
                );
              },
            ),
            StreamBuilder<Duration>(
              stream: _audio.positionStream,
              builder: (context, posSnap) {
                final pos = posSnap.data ?? Duration.zero;
                final total = _audio.duration ?? Duration.zero;
                final max = total.inMilliseconds.toDouble();
                final valor =
                    pos.inMilliseconds.clamp(0, total.inMilliseconds).toDouble();
                return Column(
                  children: [
                    Slider(
                      value: valor,
                      max: max > 0 ? max : 1,
                      onChanged: (v) =>
                          _audio.seek(Duration(milliseconds: v.round())),
                    ),
                    Text('${_fmt(pos)} / ${_fmt(total)}',
                        style: const TextStyle(fontSize: 16)),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
