import { useEffect } from 'react';
import { useLocation } from 'react-router';

// Sin recargas, el navegador ya no sube al inicio ni salta a los #anclas al cambiar de página.
// Este componente lo hace: con #hash va a ese elemento (ej. /salones/crear#catalogo-plantillas)
// y si no, sube al inicio.
export default function ScrollAlNavegar() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
