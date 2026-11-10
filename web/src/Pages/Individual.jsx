import { useEffect, useState } from 'react';
import { crearSalon, obtenerMisSalones, obtenerMiembros } from '../services/classroomService';
import { mensajeDeError } from '../components/shared/errorHandler';
import '../styles/individual.css';

// Individual (tutorías): crear tutoría (salón INDIVIDUAL), ver su código de 5 caracteres
// y ver el perfil del UsuarioA unido.


function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString() : '—';
}

export default function Individual() {
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
    <button type="button" className="boton-chico" onClick={() => handleCopiar(codigo)}>
      {codigoCopiado === codigo ? '¡Copiado!' : 'Copiar'}
    </button>
  );

  return (
    <div className="ind-pagina">
      <h1 className="titulo-pagina">Seguimiento individual</h1>
      <p className="ind-intro">
        Tutorías uno a uno: cada una tiene su código para que se una un solo alumno.
      </p>

      <section aria-labelledby="lista-tutorias">
        <h2 id="lista-tutorias" className="seccion-titulo">Tus tutorías</h2>

        {cargandoTutorias && <p role="status" className="vacio">Cargando tutorías...</p>}
        {!cargandoTutorias && tutorias.length === 0 && (
          <p className="vacio">No hay tutorías aún</p>
        )}

        <ul className="ind-lista">
          {tutorias.map((tutoria) => {
            const unidos = tutoria._count?.members;

            return (
              <li key={tutoria.id} className="ind-tarjeta">
                <div className="ind-persona">
                  <div className="avatar" aria-hidden="true">
                    {(tutoria.name || '?').trim().slice(0, 2).toUpperCase()}
                  </div>
                  <strong>{tutoria.name}</strong>
                  <br />
                  <small>
                    {unidos == null
                      ? 'Individual'
                      : unidos > 0
                        ? 'Alumno unido'
                        : 'Esperando alumno'}
                  </small>
                </div>

                <div className="ind-detalle">
                  <div className="ind-notas">
                    <div className="nota-caja">
                      <span>Código</span>
                      <code className="ind-codigo">{tutoria.joinCode}</code>
                    </div>
                    <div className="nota-caja">
                      <span>Compartir</span>
                      {botonCopiar(tutoria.joinCode)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="boton boton-sec ind-ver"
                    aria-expanded={tutoriaAbierta === tutoria.id}
                    onClick={() => handleVerPerfil(tutoria)}
                  >
                    {tutoriaAbierta === tutoria.id ? 'Ocultar perfil' : 'Ver perfil del alumno'}
                  </button>

                  {tutoriaAbierta === tutoria.id && (
                    <div className="ind-miembros">
                      {cargandoPerfil && <p role="status" className="vacio">Cargando perfil...</p>}
                      {!cargandoPerfil && miembros.length === 0 && (
                        <p className="vacio">Sin miembros</p>
                      )}
                      {miembros.map((m) => (
                        <dl key={m.student.id} className="ind-perfil">
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
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form className="tarjeta ind-form" onSubmit={handleCrear}>
        <h2 className="seccion-titulo">Crear tutoría individual</h2>
        <div className="ind-form-campos">
          <label className="campo" htmlFor="tutoria-nombre">
            <span>Nombre de la tutoría</span>
            <input
              id="tutoria-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Tutoría de lectura - Ana"
              required
            />
          </label>
          <button className="boton" type="submit" disabled={creando || !nombre.trim()}>
            {creando ? 'Creando...' : 'Crear tutoría'}
          </button>
        </div>
        {errorCrear && <p role="alert" className="mensaje error">{errorCrear}</p>}
      </form>

      {recienCreada && (
        <section className="tarjeta ind-nuevo" role="status" aria-labelledby="codigo-nuevo-titulo">
          <h2 id="codigo-nuevo-titulo" className="seccion-titulo">Tutoría {recienCreada.name} creada</h2>
          <p>Comparte este código con tu alumno para que se una desde la app:</p>
          <div className="ind-nuevo-codigo">
            <code className="ind-codigo ind-codigo-grande">{recienCreada.joinCode}</code>
            {botonCopiar(recienCreada.joinCode)}
          </div>
        </section>
      )}
    </div>
  );
}
