import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:video_player/video_player.dart';

class ReproductorScreen extends StatefulWidget {
  final String titulo;
  final String texto;
  final String videoUrl;
  final String audioUrl;

  // Los valores por defecto son de prueba. Luego se pasan los del material real.
  const ReproductorScreen({
    super.key,
    this.titulo = 'Material de estudio',
    this.texto =
        'Bienvenido al material de estudio. Este texto se puede escuchar '
            'en voz alta con el lector de voz.',
    this.videoUrl =
        'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
    this.audioUrl =
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  });

  @override
  State<ReproductorScreen> createState() => _ReproductorScreenState();
}

class _ReproductorScreenState extends State<ReproductorScreen> {
  final FlutterTts _tts = FlutterTts();
  final AudioPlayer _audio = AudioPlayer();
  late final VideoPlayerController _video;

  bool _hablando = false;
  bool _videoListo = false;
  String? _errorVideo;
  String? _errorAudio;

  @override
  void initState() {
    super.initState();
    _iniciarTts();
    _iniciarVideo();
    _iniciarAudio();
  }

  // ---------- Inicialización ----------

  Future<void> _iniciarTts() async {
    await _tts.setLanguage('es-MX');
    await _tts.setSpeechRate(0.5);
    _tts.setCompletionHandler(() {
      if (mounted) setState(() => _hablando = false);
    });
    _tts.setCancelHandler(() {
      if (mounted) setState(() => _hablando = false);
    });
    _tts.setErrorHandler((msg) {
      if (mounted) setState(() => _hablando = false);
    });
  }

  Future<void> _iniciarVideo() async {
    _video = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
    try {
      await _video.initialize();
      _video.addListener(() {
        if (mounted) setState(() {});
      });
      if (mounted) setState(() => _videoListo = true);
    } catch (_) {
      if (mounted) setState(() => _errorVideo = 'No se pudo cargar el video.');
    }
  }

  Future<void> _iniciarAudio() async {
    try {
      await _audio.setUrl(widget.audioUrl);
    } catch (_) {
      if (mounted) setState(() => _errorAudio = 'No se pudo cargar el audio.');
    }
  }

  // ---------- Controles (solo uno suena a la vez) ----------

  Future<void> _alternarTts() async {
    if (_hablando) {
      await _tts.stop();
      if (mounted) setState(() => _hablando = false);
      return;
    }
    if (_videoListo) await _video.pause();
    await _audio.pause();
    setState(() => _hablando = true);
    await _tts.speak(widget.texto);
  }

  Future<void> _alternarVideo() async {
    if (_video.value.isPlaying) {
      await _video.pause();
      return;
    }
    await _tts.stop();
    await _audio.pause();
    if (mounted) setState(() => _hablando = false);
    await _video.play();
  }

  Future<void> _alternarAudio() async {
    if (_audio.playing &&
        _audio.processingState != ProcessingState.completed) {
      await _audio.pause();
      return;
    }
    await _tts.stop();
    if (_videoListo) await _video.pause();
    if (mounted) setState(() => _hablando = false);
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
    _tts.stop();
    _audio.dispose();
    _video.dispose();
    super.dispose();
  }

  // ---------- Interfaz ----------

  Widget _tarjeta(String titulo, Widget contenido) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              titulo,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            contenido,
          ],
        ),
      ),
    );
  }

  Widget _seccionTexto() {
    return _tarjeta(
      'Lectura en voz alta',
      Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.texto, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _alternarTts,
            icon: Icon(_hablando ? Icons.stop : Icons.volume_up),
            label: Text(_hablando ? 'Detener lectura' : 'Leer en voz alta'),
          ),
        ],
      ),
    );
  }

  Widget _seccionVideo() {
    Widget contenido;
    if (_errorVideo != null) {
      contenido = Text(_errorVideo!, style: const TextStyle(color: Colors.red));
    } else if (!_videoListo) {
      contenido = const Center(child: CircularProgressIndicator());
    } else {
      contenido = Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: AspectRatio(
              aspectRatio: _video.value.aspectRatio,
              child: VideoPlayer(_video),
            ),
          ),
          const SizedBox(height: 8),
          VideoProgressIndicator(_video, allowScrubbing: true),
          IconButton(
            iconSize: 40,
            onPressed: _alternarVideo,
            icon: Icon(
              _video.value.isPlaying ? Icons.pause_circle : Icons.play_circle,
            ),
          ),
        ],
      );
    }
    return _tarjeta('Video', contenido);
  }

  Widget _seccionAudio() {
    if (_errorAudio != null) {
      return _tarjeta(
        'Audio',
        Text(_errorAudio!, style: const TextStyle(color: Colors.red)),
      );
    }
    return _tarjeta(
      'Audio',
      StreamBuilder<PlayerState>(
        stream: _audio.playerStateStream,
        builder: (context, snap) {
          final estado = snap.data?.processingState;
          final sonando =
              (snap.data?.playing ?? false) && estado != ProcessingState.completed;
          final cargando = estado == ProcessingState.loading ||
              estado == ProcessingState.buffering;
          return Row(
            children: [
              IconButton(
                iconSize: 40,
                onPressed: cargando ? null : _alternarAudio,
                icon: Icon(sonando ? Icons.pause_circle : Icons.play_circle),
              ),
              Expanded(
                child: StreamBuilder<Duration>(
                  stream: _audio.positionStream,
                  builder: (context, posSnap) {
                    final pos = posSnap.data ?? Duration.zero;
                    final total = _audio.duration ?? Duration.zero;
                    final max = total.inMilliseconds.toDouble();
                    final valor = pos.inMilliseconds
                        .clamp(0, total.inMilliseconds)
                        .toDouble();
                    return Column(
                      children: [
                        Slider(
                          value: valor,
                          max: max > 0 ? max : 1,
                          onChanged: (v) =>
                              _audio.seek(Duration(milliseconds: v.round())),
                        ),
                        Text('${_fmt(pos)} / ${_fmt(total)}'),
                      ],
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.titulo)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _seccionTexto(),
          const SizedBox(height: 16),
          _seccionVideo(),
          const SizedBox(height: 16),
          _seccionAudio(),
        ],
      ),
    );
  }
}
