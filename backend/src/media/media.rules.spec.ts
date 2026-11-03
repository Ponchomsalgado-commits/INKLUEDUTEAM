import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  UploadedMedia,
  buildObjectKey,
  contentTypeFromKey,
  displayNameFromKey,
  isOwnedKey,
  maxBytesFrom,
  validateUpload,
} from './media.rules';

const archivo = (over: Partial<UploadedMedia> = {}): UploadedMedia => ({
  originalname: 'lectura.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('x'),
  ...over,
});
const MB = 1024 * 1024;

describe('validateUpload', () => {
  it('acepta un PDF dentro del límite', () => {
    const f = archivo();
    expect(validateUpload(f, 5 * MB)).toBe(f);
  });

  it('rechaza si no viene archivo o viene vacío (400)', () => {
    expect(() => validateUpload(undefined, MB)).toThrow(BadRequestException);
    expect(() => validateUpload(archivo({ size: 0 }), MB)).toThrow(BadRequestException);
  });

  it('rechaza un archivo más pesado que el límite (413)', () => {
    expect(() => validateUpload(archivo({ size: 6 * MB }), 5 * MB)).toThrow(PayloadTooLargeException);
  });

  it('rechaza extensiones no permitidas (415)', () => {
    const exe = archivo({ originalname: 'virus.exe', mimetype: 'application/x-msdownload' });
    expect(() => validateUpload(exe, MB)).toThrow(UnsupportedMediaTypeException);
  });

  it('rechaza si el tipo MIME no corresponde a la extensión', () => {
    const falso = archivo({ originalname: 'foto.png', mimetype: 'application/pdf' });
    expect(() => validateUpload(falso, MB)).toThrow(UnsupportedMediaTypeException);
  });
});

describe('claves de objeto', () => {
  const profe = '11111111-1111-4111-8111-111111111111';

  it('construye una clave limpia bajo el prefijo del profesor', () => {
    const key = buildObjectKey(profe, 'Lección Número 1 (final).PDF');
    expect(key.startsWith(`media/${profe}/`)).toBe(true);
    expect(key.endsWith('-leccion-numero-1-final.pdf')).toBe(true);
    expect(displayNameFromKey(key)).toBe('leccion-numero-1-final.pdf');
    expect(contentTypeFromKey(key)).toBe('application/pdf');
  });

  it('solo reconoce como propias las claves de su prefijo y sin trucos de ruta', () => {
    expect(isOwnedKey(profe, `media/${profe}/a.pdf`)).toBe(true);
    expect(isOwnedKey(profe, 'media/otro-profe/a.pdf')).toBe(false);
    expect(isOwnedKey(profe, `media/${profe}/../otro/a.pdf`)).toBe(false);
    expect(isOwnedKey(profe, undefined as unknown as string)).toBe(false);
  });
});

describe('maxBytesFrom', () => {
  it('usa 50 MB si el valor no es válido', () => {
    expect(maxBytesFrom(undefined)).toBe(50 * MB);
    expect(maxBytesFrom('abc')).toBe(50 * MB);
    expect(maxBytesFrom('10')).toBe(10 * MB);
  });
});