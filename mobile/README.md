# InkluEdu — app móvil (usuarioA)

App Flutter para estudiantes. Habla solo con el backend del monorepo (`/api/v1`).

## Correr la app

```bash
flutter pub get
flutter run                                                        # emulador Android
flutter run -d chrome --dart-define=API_URL=http://localhost:3000   # Chrome
flutter run --dart-define=API_URL=http://192.168.X.X:3000           # celular físico
```

`API_URL` es la dirección del backend **sin** `/api/v1`. Si no se pasa, se usa `http://10.0.2.2:3000`, que es la PC vista desde el emulador de Android.

Con celular físico, la PC y el celular deben estar en la misma red Wi-Fi y el firewall de Windows debe permitir el puerto 3000. Para tu IP: `ipconfig` → "Dirección IPv4".

## Cómo está organizada

| Archivo                       | Responsabilidad                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `lib/main.dart`               | Arranque; si la sesión caduca sin poder renovarse, vuelve al login              |
| `lib/api_client.dart`         | Cliente `dio` único: agrega el token y lo renueva solo al recibir un 401        |
| `lib/core/token_storage.dart` | Guarda los tokens cifrados (`flutter_secure_storage`)                           |
| `lib/auth/auth_service.dart`  | Login, registro (siempre como `ESTUDIANTE`) y logout; rechaza cuentas de profesor |
| `lib/auth/auth_gate.dart`     | Decide al abrir la app: sesión guardada → Home, si no → Login                   |
| `lib/auth/*_screen.dart`      | Pantallas de login y registro, con estados de carga y error                     |
| `lib/home/home_screen.dart`   | Pantalla principal (provisional)                                                |

Las rutas de la API se escriben completas (`/api/v1/...`) en cada llamada.

## Antes de subir cambios

```bash
dart format lib
flutter analyze
```

## Problemas conocidos en Windows

**`flutter run -d chrome` se queda en "Launching" o esperando el lock de `hooks_runner\shared\objective_c\.lock`.**
`objective_c` llega como dependencia indirecta (`flutter_secure_storage` → `path_provider`) y compila un *build hook*. En algunas PCs con antivirus que intercepta procesos (Avast, Reason Cybersecurity…), el proceso que compila ese hook queda suspendido.

1. Cierra todos los `flutter run` abiertos (un `flutter run` atorado retiene el lock y bloquea a los siguientes).
2. Agrega excepciones en el antivirus para la carpeta de Flutter, `%LOCALAPPDATA%\Pub\Cache` y la carpeta del proyecto.
3. Una vez que compila, el resultado queda en caché en `.dart_tool/hooks_runner/` y no se repite hasta un `flutter clean` o un cambio de dependencias.

**`git status` muestra cambios en `linux/flutter/` y `macos/Flutter/` sin haberlos tocado.**
Flutter regenera esos archivos en cada build y en Windows solo cambian los saltos de línea. Descártalos con:

```bash
git restore linux/flutter macos/Flutter
```
