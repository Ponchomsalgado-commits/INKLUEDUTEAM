/**
 * Catálogo de insignias (Sprint 6). Todas son positivas: celebran constancia y logros propios,
 * nunca comparan a un estudiante con otro. Se sincroniza a la tabla `badges` en cada arranque.
 */
export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  /** Nombre genérico del ícono; cada cliente lo traduce a su propio set de íconos. */
  icon: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    code: 'primer_paso',
    name: 'Primer paso',
    description: 'Completaste tu primera actividad. ¡Así se empieza!',
    icon: 'rocket',
  },
  {
    code: 'constancia_diaria',
    name: 'Al día',
    description: 'Resolviste una actividad el mismo día en que se publicó.',
    icon: 'calendar',
  },
  {
    code: 'entrega_puntual',
    name: 'Puntual',
    description: 'Entregaste una actividad antes de su fecha límite.',
    icon: 'clock',
  },
  {
    code: 'todo_correcto',
    name: 'Todo correcto',
    description: 'Respondiste bien todas las preguntas de una actividad.',
    icon: 'star',
  },
  {
    code: 'racha',
    name: 'En racha',
    description: 'Practicaste varios días seguidos. Tu mejor racha queda guardada.',
    icon: 'flame',
  },
];
