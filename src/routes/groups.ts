import { Router, Request, Response } from 'express';
import axios from 'axios';
import { apiKeyAuth } from '../middleware/auth';
import { rateLimitBySession } from '../middleware/rateLimit';
import { config } from '../config';
import { prisma } from '../db/prisma';

const router = Router();

// Aplicar autenticación y rate limiting a todas las rutas de grupos
router.use(apiKeyAuth);
router.use(rateLimitBySession);

/**
 * @swagger
 * tags:
 *   - name: 👥 Grupo
 *     description: Operaciones sobre grupos de una sesión
 */

/**
 * @swagger
 * /v1/api/{session}/groups:
 *   post:
 *     summary: Crear grupo
 *     description: Crea un nuevo grupo dentro de la sesión indicada.
 *     tags: [👥 Grupo]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: session
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, participants]
 *             properties:
 *               name:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *           example:
 *             name: "string"
 *             participants:
 *               - id: "123456789@c.us"
 *     responses:
 *       '200':
 *         description: Grupo creado correctamente
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/:session/groups', async (req: Request, res: Response) => {
  try {
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || req.params.session !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.post(targetUrl, req.body, {
      headers,
      timeout: config.MASTER_API_TIMEOUT_MS,
      responseType: 'json',
      validateStatus: () => true,
    });

    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value as any);
    });
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error en POST /v1/api/{session}/groups:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

export { router as groupsRouter };