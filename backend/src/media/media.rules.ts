import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

/** Archivo en memoria tal como lo entrega multer (solo los campos que usamos). (CLAUDE) */
export interface UploadedMedia {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Extensiones permitidas y los tipos MIME que el navegador puede mandar para cada una. (CLAUDE)*/
export const ALLOWED_MEDIA: Record<string, string[]> = {
  pdf:  ['application/pdf'],
  txt:  ['text/plain'],
  png:  ['image/png'],
  jpg:  ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  mp4:  ['video/mp4'],
  webm: ['video/webm', 'audio/webm'],
  mp3:  ['audio/mpeg', 'audio/mp3'],
  m4a:  ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
  ogg:  ['audio/ogg', 'video/ogg'],
  wav:  ['audio/wav', 'audio/x-wav', 'audio/wave'],
};

export const DEFAULT_MEDIA_MAX_MB = 50;
export const MAX_MEDIA_PER_ACTIVITY = 10;
const KEY_PREFIX = 'media';

export function maxBytesFrom(valor: unknown): number {
  const mb = Number(valor);
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_MEDIA_MAX_MB) * 1024 * 1024;
}

export function extensionOf(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  return i === -1 ? '' : nombre.slice(i + 1).toLowerCase();
}

/** Valida presencia, tipo y tamaño ANTES de tocar el almacenamiento (sección 1.10). (CLAUDE)*/
export function validateUpload(file: UploadedMedia | undefined, maxBytes: number): UploadedMedia {
  if (!file || !file.buffer) {
    throw new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: "Adjunta un archivo en el campo 'file'.",
      field: 'file',
    });
  }
  if (file.size === 0) {
    throw new BadRequestException({
      error: 'VALIDATION_ERROR',
      message: 'El archivo está vacío.',
      field: 'file',
    });
  }
  if (file.size > maxBytes) {
    throw new PayloadTooLargeException();
  }
  const mimes = ALLOWED_MEDIA[extensionOf(file.originalname)];
  if (!mimes || !mimes.includes(file.mimetype.toLowerCase())) {
    throw new UnsupportedMediaTypeException({
      error: 'UNSUPPORTED_MEDIA_TYPE',
      message: `Tipo de archivo no permitido. Formatos válidos: ${Object.keys(ALLOWED_MEDIA).join(', ')}.`,
      field: 'file',
    });
  }
  return file;
}

/** media/<teacherId>/<uuid>-<nombre-limpio>.<ext>: el prefijo por profesor permite verificar propiedad. */
export function buildObjectKey(teacherId: string, originalName: string): string {
  const ext = extensionOf(originalName);
  const base = ext ? originalName.slice(0, -(ext.length + 1)) : originalName;
  const limpio =
    base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'archivo';
  return `${KEY_PREFIX}/${teacherId}/${randomUUID()}-${limpio}.${ext}`;
}

export function isOwnedKey(teacherId: string, key: string): boolean {
  return (
    typeof key === 'string' &&
    key.length <= 300 &&
    key.startsWith(`${KEY_PREFIX}/${teacherId}/`) &&
    !key.includes('..')
  );
}

/** "uuid-mi-material.pdf" -> "mi-material.pdf" */
export function displayNameFromKey(key: string): string {
  const ultimo = key.split('/').pop() ?? key;
  return ultimo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, '');
}

export function contentTypeFromKey(key: string): string {
  return ALLOWED_MEDIA[extensionOf(key)]?.[0] ?? 'application/octet-stream';
}