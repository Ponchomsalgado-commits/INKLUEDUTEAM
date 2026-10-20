import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import MisSalones from './Pages/MisSalones';

const enlaces = [
  { href: '/login', texto: 'Iniciar sesión', rutas: ['/', '/login'] },
  { href: '/register', texto: 'Registro', rutas: ['/register'] },
  { href: '/salones', texto: 'Mis salones', rutas: ['/salones'] },
];

function App() {
  const ruta = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';

  return (
    <div className="app">
      <header className="hero">
        <h1>InkluEdu</h1>
        <p>Un proyecto educativo e inclusivo para todos</p>
      </header>

      <svg className="ondas" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120 C 320 420, 760 360, 900 900 L 0 900 Z" />
        <path d="M0 420 C 420 480, 720 560, 1100 900 L 0 900 Z" />
        <path d="M160 0 C 420 260, 820 260, 840 900 L 1100 900 C 1000 420, 600 300, 360 0 Z" />
      </svg>

      <main className="contenido">
        <nav className="nav-tabs" aria-label="Navegación de cuenta">
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              aria-current={enlace.rutas.includes(ruta) ? 'page' : undefined}
            >
              {enlace.texto}
            </a>
          ))}
        </nav>

        {ruta === '/' || ruta === '/login' ? (
          <Login />
        ) : ruta === '/register' ? (
          <Register />
        ) : ruta === '/salones' ? (
          <MisSalones />
        ) : (
          <section className="tarjeta not-found">
            <h2>Página no encontrada</h2>
            <p>Prueba las rutas <a href="/login">/login</a> o <a href="/register">/register</a>.</p>
          </section>
        )}
      </main>

      <footer className="pie" />
    </div>
  );
}

export default App;
