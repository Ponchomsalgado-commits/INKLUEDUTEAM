import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../api_client.dart';

class UnirmeSalonScreen extends StatefulWidget {
  const UnirmeSalonScreen({super.key});

  @override
  State<UnirmeSalonScreen> createState() => _UnirmeSalonScreenState();

}
class _UnirmeSalonScreenState extends State<UnirmeSalonScreen> {
final _formKey = GlobalKey<FormState>();
final _codigoCtrl = TextEditingController();
bool _cargando = false;
String? _error;


Future<void> _unirme() async {
  if (!_formKey.currentState!.validate()) return;

  setState((){
    _cargando = true;
    _error = null;
  });

try{
  await ApiClient().dio.post( '/api/v1/salones/unirse',
  data: {'codigo': _codigoCtrl.text.trim().toUpperCase()},
  );

  if(!mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text("!Te uniste al salon!")),
  );
  Navigator.pop(context, true); 
}on DioException catch (e) {

  if (!mounted) return;
  setState(() => _error = _mensajeDeError(e));
  } finally {
    if(mounted) setState(() => _cargando = false);
  }
}

String _mensajeDeError(DioException e) {
  if (e.response == null) return 'Sin conexion. revisa tu internet';
  switch (e.response!.statusCode) {
    case 404:
    return 'El codigo no existe';
    case 409:
    return 'Ya perteneces a este salon';
    case 400:
    case 422:
    return 'Codigo invalido o vencido';
    default:
    return 'No se pudo unir al salon. Intena de nuevo.';
  }
}
  @override 
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Unirme a un salon')),
      body: Padding(padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children:[
            const Text('Ingresa el codigo que te dio tu profesor o tutor.',
            style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            TextFormField(controller: _codigoCtrl,
            textCapitalization: TextCapitalization.characters,
            textInputAction: TextInputAction.done,
            enabled: !_cargando,
            decoration:const InputDecoration(
              labelText: 'Codigo del salon',
              border: OutlineInputBorder(),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) {
                return 'Ingresa el codigo';
              }
              return null;
            },
            onFieldSubmitted: (_) => _unirme(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            ElevatedButton(
             onPressed: _cargando ? null : _unirme,
            child: _cargando? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
            )
            :const Text('Unirme'),
              ),
          ],
        ),
      ),
      ),
    );
  }
}
          