import '../api_client.dart';
import 'salon.dart';

class SalonesService {
  final ApiClient api;
  SalonesService(this.api);

  Future<List<Salon>> misSalones() async {
    final res = await api.dio.get('/api/v1/classrooms/me');
    final lista = res.data as List;
    return lista
        .map((e) => Salon.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}