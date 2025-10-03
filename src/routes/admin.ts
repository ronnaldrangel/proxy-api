import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';
import { generateApiKey } from '../services/keys';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Proteger todas las rutas admin con la master key
router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Operaciones administrativas de la API Proxy
 */

/**
 * @swagger
 * /admin/sessions:
 *   get:
 *     summary: Listar sesiones
 *     description: Devuelve la lista de sesiones con paginación
 *     tags: [Admin]
 *     security:
 *       - AdminApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Página a consultar (por defecto 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Tamaño de página (por defecto 20)
 *     responses:
 *       200:
 *         description: Lista de sesiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 */
router.get('/sessions', async (req: Request, res: Response) => {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '20'), 10), 1), 100);

  const [total, rows] = await Promise.all([
    prisma.session.count(),
    prisma.$queryRaw<
      Array<{
        id: string;
        apiKey: string;
        sessionName: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        lastUsedAt: Date | null;
        revokedAt: Date | null;
      }>
    >`
      SELECT
        id,
        api_key      AS "apiKey",
        session_name AS "sessionName",
        status,
        created_at   AS "createdAt",
        updated_at   AS "updatedAt",
        last_used_at AS "lastUsedAt",
        revoked_at   AS "revokedAt"
      FROM sessions
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `,
  ]);

  res.json({ total, page, pageSize, data: rows });
});

/**
 * @swagger
 * /admin/sessions:
 *   post:
 *     summary: Crear sesión (admin)
 *     description: Crea una sesión y genera una API key en texto plano
 *     tags: [Admin]
 *     security:
 *       - AdminApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionName:
 *                 type: string
 *                 description: Nombre descriptivo de la sesión
 *     responses:
 *       201:
 *         description: Sesión creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       500:
 *         description: Error del servidor
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const apiKey = generateApiKey();
    const sessionName: string | undefined = req.body?.sessionName;
    if (!sessionName || typeof sessionName !== 'string' || !sessionName.trim()) {
      return res.status(400).json({ error: 'El campo sessionName es requerido y debe ser un string no vacío' });
    }

    const session = await prisma.session.create({
      data: { apiKey, status: 'active', sessionName: sessionName.trim() },
    });

    res.status(201).json(session);
  } catch (err) {
    console.error('Admin crear sesión error:', err);
    res.status(500).json({ error: 'Error al crear sesión' });
  }
});

/**
 * @swagger
 * /admin/sessions/{id}:
 *   get:
 *     summary: Obtener una sesión
 *     description: Devuelve detalles de una sesión por ID
 *     tags: [Admin]
 *     security:
 *       - AdminApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sesión encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: No encontrada
 */
router.get('/sessions/:id', async (req: Request, res: Response) => {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      apiKey: string;
      sessionName: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      lastUsedAt: Date | null;
      revokedAt: Date | null;
    }>
  >`
    SELECT
      id,
      api_key      AS "apiKey",
      session_name AS "sessionName",
      status,
      created_at   AS "createdAt",
      updated_at   AS "updatedAt",
      last_used_at AS "lastUsedAt",
      revoked_at   AS "revokedAt"
    FROM sessions
    WHERE id = ${req.params.id}
    LIMIT 1
  `;

  const session = rows[0];
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(session);
});

/**
 * @swagger
 * /admin/sessions/{id}/rotate:
 *   post:
 *     summary: Rotar API key (admin)
 *     description: Genera una nueva API key para la sesión
 *     tags: [Admin]
 *     security:
 *       - AdminApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: API key rotada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: No encontrada
 */
router.post('/sessions/:id/rotate', async (req: Request, res: Response) => {
  const exists = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ error: 'Sesión no encontrada' });

  const newApiKey = generateApiKey();
  await prisma.session.update({
    where: { id: req.params.id },
    data: { apiKey: newApiKey, updatedAt: new Date() },
  });

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      apiKey: string;
      sessionName: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      lastUsedAt: Date | null;
      revokedAt: Date | null;
    }>
  >`
    SELECT
      id,
      api_key      AS "apiKey",
      session_name AS "sessionName",
      status,
      created_at   AS "createdAt",
      updated_at   AS "updatedAt",
      last_used_at AS "lastUsedAt",
      revoked_at   AS "revokedAt"
    FROM sessions
    WHERE id = ${req.params.id}
    LIMIT 1
  `;

  res.json(rows[0]);
});

/**
 * @swagger
 * /admin/sessions/{id}/revoke:
 *   post:
 *     summary: Revocar sesión (admin)
 *     description: Marca la sesión como revocada
 *     tags: [Admin]
 *     security:
 *       - AdminApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sesión revocada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: No encontrada
 */
router.post('/sessions/:id/revoke', async (req: Request, res: Response) => {
  const exists = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ error: 'Sesión no encontrada' });

  await prisma.session.update({
    where: { id: req.params.id },
    data: { status: 'revoked', revokedAt: new Date() },
  });

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      apiKey: string;
      sessionName: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      lastUsedAt: Date | null;
      revokedAt: Date | null;
    }>
  >`
    SELECT
      id,
      api_key      AS "apiKey",
      session_name AS "sessionName",
      status,
      created_at   AS "createdAt",
      updated_at   AS "updatedAt",
      last_used_at AS "lastUsedAt",
      revoked_at   AS "revokedAt"
    FROM sessions
    WHERE id = ${req.params.id}
    LIMIT 1
  `;

  res.json(rows[0]);
});

/**
 * @swagger
 * /admin/sessions/{id}:
 *   delete:
 *     summary: Eliminar sesión (admin)
 *     description: Elimina una sesión por ID
 *     tags: [Admin]
 *     security:
 *       - AdminApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Eliminada
 *       404:
 *         description: No encontrada
 */
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

  await prisma.session.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as adminRouter };