import { useEffect, useMemo, useState } from 'react';
import { listarMaterial } from '../services/mediaService';
import { mensajeDeError } from './shared/errorHandler';
import {
  ICONOS_MATERIAL,
  extensionDe,
  formatearTamano,
  tipoDeMaterial,
} from './shared/materialUtils';
import '../styles/material.css';

// Selector del material que ya está en la galería (GET /media). Elegir uno lo agrega a la lista de la
// actividad sin volver a subirlo: solo se guarda su key.
// materiales/onChange: la misma lista que usa SubirMaterial. maximo: tope de archivos de la actividad.

const FILTROS = [
  { clave: 'todos', texto: 'Todos' },
  { clave: 'lectura', texto: 'Lectura' },
  { clave: 'video', texto: 'Video' },
  { clave: 'audio', texto: 'Audio' },
];

const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ElegirMaterialGaleria({ materiales, onChange, maximo }) {
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipoActivo, setTipoActivo] = useState('todos');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vigente = true;
    listarMaterial()
      .then((data) => vigente && setArchivos(Array.isArray(data) ? data : []))
      .catch((err) => vigente && setError(mensajeDeError(err, 'No se pudo cargar tu galería.')))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const filtro = normalizar(busqueda.trim());
  const visibles = useMemo(
    () =>
      archivos.filter(
        (a) =>
          (tipoActivo === 'todos' || tipoDeMaterial(a.name) === tipoActivo) &&
          normalizar(a.name).includes(filtro),
      ),
    [archivos, tipoActivo, filtro],
  );

  const elegidas = new Set(materiales.map((m) => m.key).filter(Boolean));
  const lleno = materiales.length >= maximo;

  const alternar = (archivo) => {
    if (elegidas.has(archivo.key)) {
      setAviso('');
      onChange((lista) => lista.filter((m) => m.key !== archivo.key));
      return;
    }
    if (lleno) {
      setAviso(`Máximo ${maximo} archivos por actividad. Quita uno para agregar otro.`);
      return;
    }
    setAviso('');
    onChange((lista) =>
      lista.some((m) => m.key === archivo.key)
        ? lista
        : [
            ...lista,
            {
              id: archivo.key,
              key: archivo.key,
              nombre: archivo.name,
              tamano: archivo.size,
              tipo: tipoDeMaterial(archivo.name),
              estado: 'listo',
              url: archivo.url,
            },
          ],
    );
  };

  return (
    <div className="mat-galeria">
      <label htmlFor="mat-galeria-buscar" className="solo-lectores">
        Buscar en mi galería
      </label>
      <input
        id="mat-galeria-buscar"
        type="search"
        className="buscador"
        placeholder="Buscar en mi galería..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="filtros" role="group" aria-label="Filtrar por tipo de archivo">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            type="button"
            className="chip-filtro"
            aria-pressed={tipoActivo === f.clave}
            onClick={() => setTipoActivo(f.clave)}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {cargando && <p role="status">Cargando tu galería...</p>}
      {error && (
        <p className="mat-avisos" role="alert">
          {error}
        </p>
      )}
      {!cargando && !error && visibles.length === 0 && (
        <p className="vacio">
          {archivos.length === 0
            ? 'Tu galería aún no tiene archivos. Sube uno desde la pestaña “Subir archivo”.'
            : 'No hay archivos con esa búsqueda. Prueba con otra palabra o filtro.'}
        </p>
      )}
      {aviso && (
        <p className="mat-avisos" role="alert">
          {aviso}
        </p>
      )}

      <ul className="mat-galeria-lista">
        {visibles.map((a) => {
          const elegida = elegidas.has(a.key);
          const tipo = tipoDeMaterial(a.name);
          return (
            <li key={a.key}>
              <button
                type="button"
                className={`mat-galeria-item${elegida ? ' elegida' : ''}`}
                aria-pressed={elegida}
                onClick={() => alternar(a)}
                title={a.name}
              >
                <span className="mat-galeria-check" aria-hidden="true">
                  {elegida ? '✓' : ''}
                </span>
                <span className="mat-icono" aria-hidden="true">
                  {ICONOS_MATERIAL[tipo]}
                </span>
                <span className="mat-info">
                  <strong>{a.name}</strong>
                  <small>
                    {extensionDe(a.name).toUpperCase()}
                    {a.size != null && ` · ${formatearTamano(a.size)}`}
                  </small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
