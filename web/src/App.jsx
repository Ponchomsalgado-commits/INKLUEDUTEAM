import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import MisSalones from './Pages/MisSalones';

function App() {
  const ruta = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';

  return (
    <main className="app-container">
      <h1>InkluEduu</h1>
      <nav className="nav-buttons" aria-label="Navegación de cuenta">
        <a href="/login">
          Login
        </a>
        <a href="/register">
          Registro
        </a>
        <a href="/salones">
          Mis salones
        </a>
      </nav>
      {ruta === '/' || ruta === '/login' ? (
        <Login />
      ) : ruta === '/register' ? (
        <Register />
      ) : ruta === '/salones' ? (
        <MisSalones />
      ) : (
        <section className="not-found">
          <h2>Página no encontrada</h2>
          <p>Prueba las rutas <a href="/login">/login</a> o <a href="/register">/register</a>.</p>
        </section>
      )}
    </main>
  );
}

export default App;