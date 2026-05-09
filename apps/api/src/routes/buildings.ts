// 건물 라우트 — list / detail / update / photo upload / memo (PR #4)
import type { FastifyPluginAsync } from 'fastify';
import { BuildingUpdate, BuildingMemoInput } from '@aims/shared';
import { prisma } from '@/lib/prisma';
import { storage } from '@/lib/storage';
import { compressBuildingPhoto } from '@/lib/photos';
import { requireRole, requireAuth } from '@/lib/auth/guards';

function serializeBuilding(b: NonNullable<Awaited<ReturnType<typeof prisma.building.findFirst>>>) {
  return {
    id: b.id,
    legacyId: b.legacyId,
    name: b.name,
    address: b.address,
    use: b.use,
    area: { sqm: b.areaSqm, pyeong: b.areaPyeong },
    floors: b.floors,
    approvalDate: b.approvalDate ? b.approvalDate.toISOString().slice(0, 10) : null,
    acquisitionDate: b.acquisitionDate.toISOString().slice(0, 10),
    acquisitionPrice: b.acquisitionPrice.toString(),
    rental: { area: b.rentalArea, rate: b.rentalRate, vacancy: b.vacancy },
    tenant: b.tenant,
    lat: b.lat,
    lng: b.lng,
    photoUrl: b.photoUrl,
    detailPhotoUrl: b.detailPhotoUrl,
    updatedBy: b.updatedById,
    updatedAt: b.updatedAt.toISOString(),
  };
}

export const buildingRoutes: FastifyPluginAsync = async (app) => {
  // ── GET list (viewer+)
  app.get('/buildings', { preHandler: requireAuth() }, async () => {
    const items = await prisma.building.findMany({
      orderBy: { acquisitionDate: 'desc' },
    });
    return { ok: true, data: items.map(serializeBuilding) };
  });

  // ── GET detail
  app.get<{ Params: { id: string } }>(
    '/buildings/:id',
    { preHandler: requireAuth() },
    async (req, reply) => {
      const b = await prisma.building.findUnique({ where: { id: req.params.id } });
      if (!b) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '건물 없음' });
        return;
      }
      return { ok: true, data: serializeBuilding(b) };
    },
  );

  // ── PUT update (editor+)
  app.put<{ Params: { id: string } }>(
    '/buildings/:id',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = BuildingUpdate.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({
          ok: false,
          code: 'VALIDATION',
          message: '입력 형식 오류',
        });
        return;
      }
      const data = parsed.data;
      const updateData: Record<string, unknown> = { updatedById: req.user!.id };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.use !== undefined) updateData.use = data.use;
      if (data.area) {
        updateData.areaSqm = data.area.sqm;
        updateData.areaPyeong = data.area.pyeong;
      }
      if (data.floors !== undefined) updateData.floors = data.floors;
      if (data.approvalDate !== undefined) {
        updateData.approvalDate = data.approvalDate ? new Date(data.approvalDate) : null;
      }
      if (data.acquisitionDate !== undefined) updateData.acquisitionDate = new Date(data.acquisitionDate);
      if (data.acquisitionPrice !== undefined) {
        updateData.acquisitionPrice = typeof data.acquisitionPrice === 'bigint'
          ? data.acquisitionPrice
          : BigInt(Math.round(data.acquisitionPrice));
      }
      if (data.rental) {
        updateData.rentalArea = data.rental.area;
        updateData.rentalRate = data.rental.rate;
        updateData.vacancy = data.rental.vacancy;
      }
      if (data.tenant !== undefined) updateData.tenant = data.tenant;
      if (data.lat !== undefined) updateData.lat = data.lat;
      if (data.lng !== undefined) updateData.lng = data.lng;

      try {
        const updated = await prisma.building.update({
          where: { id: req.params.id },
          data: updateData,
        });
        return { ok: true, data: serializeBuilding(updated) };
      } catch {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '건물 없음' });
      }
    },
  );

  // ── POST photo (editor+)
  app.post<{ Params: { id: string } }>(
    '/buildings/:id/photo',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const file = await req.file();
      if (!file) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '사진 파일 없음' });
        return;
      }
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype)) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '이미지 파일만 허용' });
        return;
      }
      const building = await prisma.building.findUnique({ where: { id: req.params.id } });
      if (!building) {
        reply.code(404).send({ ok: false, code: 'NOT_FOUND', message: '건물 없음' });
        return;
      }
      const raw = await file.toBuffer();
      const compressed = await compressBuildingPhoto(raw);
      const key = `buildings/${building.legacyId}.${compressed.ext}`;
      const result = await storage.save(key, compressed.buf, compressed.mime);

      const updated = await prisma.building.update({
        where: { id: building.id },
        data: { photoUrl: result.url, updatedById: req.user!.id },
      });
      return { ok: true, data: { photoUrl: updated.photoUrl, bytes: result.bytes } };
    },
  );

  // ── GET memo
  app.get<{ Params: { id: string } }>(
    '/buildings/:id/memo',
    { preHandler: requireAuth() },
    async (req) => {
      const memo = await prisma.buildingMemo.findUnique({ where: { buildingId: req.params.id } });
      return {
        ok: true,
        data: memo
          ? {
              buildingId: memo.buildingId,
              body: memo.body,
              updatedBy: memo.updatedById,
              updatedAt: memo.updatedAt.toISOString(),
            }
          : null,
      };
    },
  );

  // ── PUT memo (editor+)
  app.put<{ Params: { id: string } }>(
    '/buildings/:id/memo',
    { preHandler: requireRole('editor', 'admin') },
    async (req, reply) => {
      const parsed = BuildingMemoInput.safeParse(req.body);
      if (!parsed.success) {
        reply.code(422).send({ ok: false, code: 'VALIDATION', message: '본문 형식 오류' });
        return;
      }
      const memo = await prisma.buildingMemo.upsert({
        where: { buildingId: req.params.id },
        create: {
          buildingId: req.params.id,
          body: parsed.data.body,
          updatedById: req.user!.id,
        },
        update: {
          body: parsed.data.body,
          updatedById: req.user!.id,
        },
      });
      return {
        ok: true,
        data: {
          buildingId: memo.buildingId,
          body: memo.body,
          updatedBy: memo.updatedById,
          updatedAt: memo.updatedAt.toISOString(),
        },
      };
    },
  );
};
