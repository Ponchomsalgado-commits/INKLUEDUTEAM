import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';
import { SELECCIONAR_OBJETIVO_SCHEMA } from '../templates/templates.catalog';
import { TemplatesService } from '../templates/templates.service';
import { ActivitiesService } from './activities.service';

const template = {
  id: 'tpl-1',
  type: 'seleccionar_objetivo',
  skin: 'rana_nenufar',
  displayName: 'Rana y sus nenúfares',
  schemaJson: SELECCIONAR_OBJETIVO_SCHEMA,
};

const contenido = (correctas = [true, false, false]) => ({
  preguntas: [
    {
      id: 'p-1',
      pregunta: '¿2 + 2?',
      opciones: correctas.map((correcta, i) => ({ texto: `${i}`, correcta })),
    },
  ],
});

const clavesDe = (valor: unknown): string[] => {
  if (Array.isArray(valor)) return valor.flatMap(clavesDe);
  if (valor && typeof valor === 'object') {
    return Object.entries(valor as Record<string, unknown>).flatMap(([clave, v]) => [
      clave,
      ...clavesDe(v),
    ]);
  }
  return [];
};

describe('ActivitiesService', () => {
  const prisma = {
    teacherActivity: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    gameTemplate: { update: jest.fn(), upsert: jest.fn() },
  };
  const templates = { findOne: jest.fn() };
  const media = {
    assertOwnedKeys: jest.fn((_t: string, keys: string[]) => keys),
    describe: jest.fn((key: string) => Promise.resolve({ key, url: `https://firmada/${key}` })),
  };
  const service = new ActivitiesService(
    prisma as unknown as PrismaService,
    templates as unknown as TemplatesService,
    media as unknown as MediaService,
  );

  const guardada = (over = {}) => ({
    id: 'act-1',
    teacherId: 'profe-1',
    templateId: template.id,
    template,
    title: 'Sumas',
    contentJson: contenido(),
    mediaUrls: [],
    contentVersion: 1,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    templates.findOne.mockResolvedValue(template);
    prisma.teacherActivity.create.mockImplementation(({ data }) => Promise.resolve(guardada(data)));
    prisma.teacherActivity.update.mockImplementation(({ data }) => Promise.resolve(guardada(data)));
  });

  it('crea una copia propia con el contenido normalizado y sin tocar la plantilla', async () => {
    const r = await service.create('profe-1', {
      templateId: template.id,
      title: '  Sumas  ',
      contentJson: contenido(),
    });

    const { data } = prisma.teacherActivity.create.mock.calls[0][0];
    expect(data).toMatchObject({ teacherId: 'profe-1', templateId: template.id, title: 'Sumas' });
    expect(r.template).toMatchObject({ type: 'seleccionar_objetivo', skin: 'rana_nenufar' });
    expect(prisma.gameTemplate.update).not.toHaveBeenCalled();
  });

  it('rechaza un contenido que no cumple el schema, señalando el campo', async () => {
    await expect(
      service.create('profe-1', { templateId: template.id, title: 'X', contentJson: contenido([true, true, false]) }),
    ).rejects.toMatchObject({
      response: { error: 'VALIDATION_ERROR', field: 'preguntas[0].opciones' },
    });
    expect(prisma.teacherActivity.create).not.toHaveBeenCalled();
  });

  it('rechaza un título vacío', async () => {
    await expect(
      service.create('profe-1', { templateId: template.id, title: '   ', contentJson: contenido() }),
    ).rejects.toThrow(BadRequestException);
  });

  it('solo busca actividades del profesor autenticado (otro profesor recibe 404)', async () => {
    prisma.teacherActivity.findFirst.mockResolvedValue(null);

    await expect(service.findOneOf('profe-2', 'act-1')).rejects.toThrow(NotFoundException);
    expect(prisma.teacherActivity.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'act-1', teacherId: 'profe-2' } }),
    );
    await expect(service.update('profe-2', 'act-1', { title: 'Robada' })).rejects.toThrow(NotFoundException);
    expect(prisma.teacherActivity.update).not.toHaveBeenCalled();
  });

  it('editar revalida contra el schema y sube content_version solo si el contenido cambió', async () => {
    prisma.teacherActivity.findFirst.mockResolvedValue(guardada());

    await service.update('profe-1', 'act-1', { contentJson: contenido([false, true, false]) });
    expect(prisma.teacherActivity.update.mock.calls[0][0].data.contentVersion).toEqual({ increment: 1 });

    prisma.teacherActivity.update.mockClear();
    await service.update('profe-1', 'act-1', { contentJson: contenido() }); // idéntico
    expect(prisma.teacherActivity.update.mock.calls[0][0].data.contentVersion).toBeUndefined();

    await expect(
      service.update('profe-1', 'act-1', { contentJson: contenido([false, false, false]) }),
    ).rejects.toThrow(BadRequestException);
  });

  it('editar no permite cambiar la plantilla y exige al menos un campo', async () => {
    prisma.teacherActivity.findFirst.mockResolvedValue(guardada());

    await service.update('profe-1', 'act-1', { title: 'Nuevo título' });
    expect(prisma.teacherActivity.update.mock.calls[0][0].data).not.toHaveProperty('templateId');

    await expect(service.update('profe-1', 'act-1', {})).rejects.toThrow(BadRequestException);
  });

  it('valida que los archivos adjuntos sean del profesor', async () => {
    await service.create('profe-1', {
      templateId: template.id,
      title: 'Con material',
      contentJson: contenido(),
      mediaUrls: ['media/profe-1/a.pdf'],
    });
    expect(media.assertOwnedKeys).toHaveBeenCalledWith('profe-1', ['media/profe-1/a.pdf']);
  });

  it('prepara la actividad para jugar sin dueño y sin exponer la clave correcta', async () => {
    prisma.teacherActivity.findUnique.mockResolvedValue(
      guardada({ mediaUrls: ['media/profe-1/a.pdf'] }),
    );

    const r = await service.findForPlay('act-1');

    expect(prisma.teacherActivity.findUnique).toHaveBeenCalledWith({
      where: { id: 'act-1' },
      include: { template: true },
    });
    expect(clavesDe(r)).not.toContain('correcta');
    expect(r).toMatchObject({
      activityId: 'act-1',
      title: 'Sumas',
      type: 'seleccionar_objetivo',
      skin: 'rana_nenufar',
      contentVersion: 1,
      totalPreguntas: 1,
    });
    expect(r.preguntas[0].opciones).toEqual([
      { id: 0, texto: '0' },
      { id: 1, texto: '1' },
      { id: 2, texto: '2' },
    ]);
    expect(r.media).toEqual([{ key: 'media/profe-1/a.pdf', url: 'https://firmada/media/profe-1/a.pdf' }]);
  });

  it('expone el contenido completo para calificar', async () => {
    prisma.teacherActivity.findUnique.mockResolvedValue(guardada());

    await expect(service.findContentForGrading('act-1')).resolves.toEqual({
      id: 'act-1',
      contentVersion: 1,
      contentJson: contenido(),
      title: 'Sumas',
    });
  });

  it('devuelve 404 al jugar o calificar una actividad inexistente', async () => {
    prisma.teacherActivity.findUnique.mockResolvedValue(null);

    await expect(service.findForPlay('act-404')).rejects.toThrow(NotFoundException);
    await expect(service.findContentForGrading('act-404')).rejects.toThrow(NotFoundException);
  });
});