import { useEffect, useState } from 'react';
import { crearSalon, obtenerMisSalones, obtenerMiembros } from '../services/classroomService';
import { mensajeDeError } from '../components/errorHandler';

// Tutorías individuales: crear tutoría (salón INDIVIDUAL), ver su código de 5 caracteres
// y ver el perfil del UsuarioA unido.


function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString() : '—';
}

export default function Tutorias() {
  const [tutorias, setTutorias] = useState([]);
  const [cargandoTutorias, setCargandoTutorias] = useState(true);

  // formulario de crear tutoría
  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');
  const [recienCreada, setRecienCreada] = useState(null);

  // tutoría abierta y el perfil de su alumno
  const [tutoriaAbierta, setTutoriaAbierta] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  const [codigoCopiado, setCodigoCopiado] = useState('');

  useEffect(() => {
    obtenerMisSalones()
      .then((data) => {
        // Solo aceptamos arreglos y nos quedamos con los salones individuales
        const salones = Array.isArray(data) ? data : [];
        setTutorias(salones.filter((s) => s.type === 'INDIVIDUAL'));
      })
      // Si la lista no se puede cargar se muestra como vacía en vez del error
      .catch(() => setTutorias([]))
      .finally(() => setCargandoTutorias(false));
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setErrorCrear('');
    setRecienCreada(null);
    setCreando(true);

    try {
      const nueva = await crearSalon({ name: nombre.trim(), type: 'INDIVIDUAL' });
      setTutorias((prev) => [{ ...nueva, _count: { members: 0 } }, ...prev]);
      setRecienCreada(nueva);
      setNombre('');
    } catch (error) {
      setErrorCrear(mensajeDeError(error, 'No se pudo crear la tutoría'));
    } finally {
      setCreando(false);
    }
  };

  const handleVerPerfil = async (tutoria) => {
    if (tutoriaAbierta === tutoria.id) {
      setTutoriaAbierta(null);
      return;
    }

    setTutoriaAbierta(tutoria.id);
    setMiembros([]);
    setCargandoPerfil(true);

    try {
      const data = await obtenerMiembros(tutoria.id);
      setMiembros(Array.isArray(data) ? data : []);
    } catch {
      // Si el perfil no se puede cargar se muestra "Sin miembros" en vez del error
      setMiembros([]);
    } finally {
      setCargandoPerfil(false);
    }
  };

  const handleCopiar = async (codigo) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCodigoCopiado(codigo);
      setTimeout(() => setCodigoCopiado(''), 2000);
    } catch {
      // si el navegador no deja copiar, el código sigue visible en pantalla
    }
  };

  const botonCopiar = (codigo) => (
    <button type="button" onClick={() => handleCopiar(codigo)}>
      {codigoCopiado === codigo ? '¡Copiado!' : 'Copiar'}
    </button>
  );

  return (
    <div className="tarjeta salones-container salones-ancho">
      <section aria-labelledby="lista-tutorias" className="seccion-salones">
        <div className="encabezado-seccion">
          <h2 id="lista-tutorias">Tus tutorías</h2>
          <a href="/salones/crear" className="btn-crear">
            + Crear salón
          </a>
        </div>

        {cargandoTutorias && <p role="status">Cargando tutorías...</p>}
        {!cargandoTutorias && tutorias.length === 0 && (
          <p className="sin-datos">No hay tutorías aún</p>
        )}

        <ul className="lista-salones">
          {tutorias.map((tutoria) => {
            const unidos = tutoria._count?.members;

            return (
              <li key={tutoria.id} className="salon-card">
                <div className="salon-info">
                  <strong>{tutoria.name}</strong>
                  <span className="salon-tipo">
                    {unidos == null
                      ? 'Individual'
                      : unidos > 0
                        ? 'Alumno unido'
                        : 'Esperando alumno'}
                  </span>
                </div>

                <div className="salon-codigo">
                  <span>Código:</span>
                  <code>{tutoria.joinCode}</code>
                  {botonCopiar(tutoria.joinCode)}
                </div>

                <button
                  type="button"
                  className="ver-miembros"
                  aria-expanded={tutoriaAbierta === tutoria.id}
                  onClick={() => handleVerPerfil(tutoria)}
                >
                  {tutoriaAbierta === tutoria.id ? 'Ocultar perfil' : 'Ver perfil del alumno'}
                </button>

                {tutoriaAbierta === tutoria.id && (
                  <div className="miembros">
                    {cargandoPerfil && <p role="status">Cargando perfil...</p>}
                    {!cargandoPerfil && miembros.length === 0 && (
                      <p className="sin-datos">Sin miembros</p>
                    )}
                    {miembros.map((m) => (
                      <dl key={m.student.id} className="perfil-alumno">
                        <dt>Correo</dt>
                        <dd>{m.student.email}</dd>
                        <dt>Rol</dt>
                        <dd>
                          {m.student.role === 'ESTUDIANTE' ? 'Estudiante' : m.student.role || '—'}
                        </dd>
                        <dt>Se unió a la tutoría</dt>
                        <dd>{formatearFecha(m.joinedAt)}</dd>
                        <dt>Cuenta creada</dt>
                        <dd>{formatearFecha(m.student.createdAt)}</dd>
                      </dl>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <form className="crear-salon crear-salon-horizontal" onSubmit={handleCrear}>
        <h3>Crear tutoría individual</h3>
        <div className="crear-salon-campos campos-dos">
          <div className="form-group">
            <label htmlFor="tutoria-nombre">Nombre de la tutoría</label>
            <input
              id="tutoria-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Tutoría de lectura - Ana"
              required
            />
          </div>
          <button type="submit" disabled={creando || !nombre.trim()}>
            {creando ? 'Creando...' : 'Crear tutoría'}
          </button>
        </div>
        {errorCrear && <p role="alert">{errorCrear}</p>}
      </form>

      {recienCreada && (
        <section className="codigo-nuevo" role="status" aria-labelledby="codigo-nuevo-titulo">
          <h3 id="codigo-nuevo-titulo">Tutoría {recienCreada.name} creada</h3>
          <p>Comparte este código con tu alumno para que se una desde la app:</p>
          <div className="salon-codigo">
            <code className="codigo-grande">{recienCreada.joinCode}</code>
            {botonCopiar(recienCreada.joinCode)}
          </div>
        </section>
      )}
    </div>
  );
}
