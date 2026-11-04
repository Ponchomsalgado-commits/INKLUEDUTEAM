import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GameTemplate, Prisma, TeacherActivity } from '@prisma/client';
import { isDeepStrictEqual } from 'util';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import { ContentValidationError, TemplateSchema, validateContent,} from './content-schema/schema-validator';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

/** content_json debe ser pequeño: viaja en cada petición y se cachea completo en el móvil (sección 1.11). (CLAUDE)*/
export const MAX_CONTENT_BYTES = 100 * 1024;

type ActivityWithTemplate = TeacherActivity & { template: GameTemplate };

function campoInvalido(message: string, field: string) {
  return new BadRequestException({ error: 'VALIDATION_ERROR', message, field });
}

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly media: MediaService,
  ) {}

  async create(teacherId: string, dto: CreateActivityDto) {
    const template = await this.templates.findOne(dto.templateId);
    const title = this.cleanTitle(dto.title);
    const contentJson = this.validateAgainstTemplate(template, dto.contentJson);
    const mediaUrls = this.media.assertOwnedKeys(teacherId, dto.mediaUrls ?? []);

    // La actividad es una COPIA: guarda su propio content_json, nunca modifica la plantilla (CLAUDE)
    const created = await this.prisma.teacherActivity.create({
      data: {
        teacherId,
        templateId: template.id,
        title,
        contentJson: contentJson as Prisma.InputJsonValue,
        mediaUrls,
      },
      include: { template: true },
    });
    return this.present(created);
  }

  /** "Mis actividades": resumen liviano, más recientes primero. (CLAUDE)*/
  async findAllOf(teacherId: string) {
    const rows = await this.prisma.teacherActivity.findMany({
      where: { teacherId },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((a) => ({
      id: a.id,
      title: a.title,
      template: this.summarizeTemplate(a.template),
      mediaCount: a.mediaUrls.length,
      contentVersion: a.contentVersion,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  async findOneOf(teacherId: string, id: string) {
    return this.present(await this.getOwned(teacherId, id));
  }

  async update(teacherId: string, id: string, dto: UpdateActivityDto) {
    if (dto.title === undefined && dto.contentJson === undefined && dto.mediaUrls === undefined) {
      throw campoInvalido('Envía al menos un campo para editar.', 'title');
    }
    const current = await this.getOwned(teacherId, id);
    const data: Prisma.TeacherActivityUpdateInput = {};
    let contentChanged = false;

    if (dto.title !== undefined) {
      data.title = this.cleanTitle(dto.title);
    }
    if (dto.contentJson !== undefined) {
      // Se revalida SIEMPRE contra el schema de la plantilla de origen, igual que al crear (CLAUDE)
      const contentJson = this.validateAgainstTemplate(current.template, dto.contentJson);
      if (!isDeepStrictEqual(contentJson, current.contentJson)) {
        data.contentJson = contentJson as Prisma.InputJsonValue;
        contentChanged = true;
      }
    }
    if (dto.mediaUrls !== undefined) {
      const mediaUrls = this.media.assertOwnedKeys(teacherId, dto.mediaUrls);
      if (!isDeepStrictEqual(mediaUrls, current.mediaUrls)) {
        data.mediaUrls = mediaUrls;
        contentChanged = true;
      }
    }
    // content_version permite al móvil detectar que su copia local quedó desactualizada (CLAUDE)
    if (contentChanged) data.contentVersion = { increment: 1 };

    const updated = await this.prisma.teacherActivity.update({
      where: { id },
      data,
      include: { template: true },
    });
    return this.present(updated);
  }

  /** Solo el dueño la ve; para cualquier otro es 404 (no revela que existe). (CLAUDE)*/
  private async getOwned(teacherId: string, id: string): Promise<ActivityWithTemplate> {
    const activity = await this.prisma.teacherActivity.findFirst({
      where: { id, teacherId },
      include: { template: true },
    });
    if (!activity) {
      throw new NotFoundException('La actividad no existe.');
    }
    return activity;
  }

  private cleanTitle(title: string): string {
    const limpio = title.trim();
    if (!limpio) throw campoInvalido('El título no puede estar vacío.', 'title');
    return limpio;
  }

  private validateAgainstTemplate(template: GameTemplate, content: unknown) {
    if (Buffer.byteLength(JSON.stringify(content ?? null)) > MAX_CONTENT_BYTES) {
      throw campoInvalido(
        `El contenido supera el máximo de ${MAX_CONTENT_BYTES / 1024} KB. Los textos largos van como material adjunto.`,
        'contentJson',
      );
    }
    try {
      return validateContent(template.schemaJson as unknown as TemplateSchema, content);
    } catch (error) {
      if (error instanceof ContentValidationError) {
        // `field` es la ruta dentro del contenido, p. ej. "preguntas[1].opciones" (CLAUDE)
        throw campoInvalido(error.message, error.field);
      }
      throw error;
    }
  }

  private summarizeTemplate(t: GameTemplate) {
    return { id: t.id, type: t.type, skin: t.skin, displayName: t.displayName };
  }

  private async present(a: ActivityWithTemplate) {
    return {
      id: a.id,
      title: a.title,
      templateId: a.templateId,
      template: this.summarizeTemplate(a.template),
      contentJson: a.contentJson,
      mediaUrls: a.mediaUrls, // claves guardadas
      media: await Promise.all(a.mediaUrls.map((key) => this.media.describe(key))),
      contentVersion: a.contentVersion,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}