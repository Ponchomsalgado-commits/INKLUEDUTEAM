import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAX_MEDIA_PER_ACTIVITY,
  UploadedMedia,
  buildObjectKey,
  contentTypeFromKey,
  displayNameFromKey,
  isOwnedKey,
  maxBytesFrom,
  validateUpload,
} from './media.rules';

export interface MediaReference {
  key: string;
  name: string;
  contentType: string;
  url: string;
  expiresIn: number;
}

/**
 * Almacenamiento de material didáctico en MinIO (S3 compatible; en producción puede ser S3/R2
 * sin cambiar código, sección 2.6). En la base solo se guarda la CLAVE del objeto; el archivo
 * se entrega siempre con una URL firmada que caduca, nunca pública. (CLAUDE)
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucket: string;
  private readonly maxBytes: number;
  private readonly expiresIn: number;
  private readonly internal: S3Client;
  private readonly publico: S3Client;
  private bucketListo?: Promise<void>;

  constructor(config: ConfigService) {
    const host = config.get<string>('MINIO_ENDPOINT', 'localhost');
    const puerto = Number(config.get('MINIO_PORT', 9000));
    const credentials = {
      accessKeyId: config.get<string>('MINIO_ROOT_USER', ''),
      secretAccessKey: config.get<string>('MINIO_ROOT_PASSWORD', ''),
    };
    const base = { region: 'us-east-1', credentials, forcePathStyle: true };

    const interno = `http://${host}:${puerto}`;
    this.internal = new S3Client({ ...base, endpoint: interno });
    this.publico = new S3Client({
      ...base,
      endpoint: config.get<string>('MINIO_PUBLIC_URL') || interno,
    });

    this.bucket = config.get<string>('MINIO_BUCKET', 'tdah-media');
    this.maxBytes = maxBytesFrom(config.get('MEDIA_MAX_MB'));
    this.expiresIn = Number(config.get('MEDIA_URL_EXPIRES_SECONDS', 3600)) || 3600;
  }

  /** Sube el archivo y devuelve su referencia: `key` es lo que se guarda en media_urls. */
  async upload(teacherId: string, file: UploadedMedia | undefined): Promise<MediaReference & { size: number }> {
    const valido = validateUpload(file, this.maxBytes);
    const key = buildObjectKey(teacherId, valido.originalname);

    try {
      await this.asegurarBucket();
      await this.internal.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: valido.buffer,
          ContentType: contentTypeFromKey(key),
        }),
      );
    } catch (error) {
      this.logger.error(`No se pudo subir a MinIO: ${(error as Error).message}`);
      throw new ServiceUnavailableException(
        'No se pudo guardar el archivo en este momento. Intenta de nuevo.',
      );
    }

    return { ...(await this.describe(key)), size: valido.size };
  }

  /** Referencia con URL firmada. La usan Activities (profesor) y, en el Sprint 4, /activities/:id/play. (CLAUDE)*/
  async describe(key: string): Promise<MediaReference> {
    return {
      key,
      name: displayNameFromKey(key),
      contentType: contentTypeFromKey(key),
      url: await this.signedUrl(key),
      expiresIn: this.expiresIn,
    };
  }

  signedUrl(key: string): Promise<string> {
    return getSignedUrl(this.publico, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.expiresIn,
    });
  }

  /** Un profesor solo puede adjuntar material que él mismo subió. (CLAUDE)*/
  assertOwnedKeys(teacherId: string, keys: string[]): string[] {
    const unicas = [...new Set(keys)];
    if (unicas.length > MAX_MEDIA_PER_ACTIVITY) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: `Una actividad admite como máximo ${MAX_MEDIA_PER_ACTIVITY} archivos.`,
        field: 'mediaUrls',
      });
    }
    const ajena = unicas.find((k) => !isOwnedKey(teacherId, k));
    if (ajena !== undefined) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Uno de los archivos no existe o no te pertenece. Súbelo de nuevo.',
        field: 'mediaUrls',
      });
    }
    return unicas;
  }

  private asegurarBucket(): Promise<void> {
    this.bucketListo ??= this.crearBucketSiFalta().catch((e) => {
      this.bucketListo = undefined; // permite reintentar si MinIO aún estaba arrancando
      throw e;
    });
    return this.bucketListo;
  }

  private async crearBucketSiFalta() {
    try {
      await this.internal.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.internal.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket '${this.bucket}' creado`);
    }
  }
}