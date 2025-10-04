import { Router, Request, Response } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import { rateLimitBySession } from '../middleware/rateLimit';
import { prisma } from '../db/prisma';
import axios from 'axios';
import { config } from '../config';

const router = Router();

// Aplicar autenticación y rate limiting a todas las rutas de sesión
router.use(apiKeyAuth);
router.use(rateLimitBySession);

/**
 * @swagger
 * tags:
 *   - name: 🖥️ Sesion
 *     description: Información y operaciones sobre la sesión autenticada
 */

/**
 * @swagger
 * /v1/api/sessions/{session}:
 *   get:
 *     summary: Obtener información de la sesión
 *     description: Devuelve información pública de la sesión indicada, validando que coincida con la API key.
 *     tags: [🖥️ Sesion]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: session
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la sesión
 *     responses:
 *       '200':
 *         description: Información de la sesión obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sessionName:
 *                   type: string
 *                 status:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 lastUsedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 revokedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '404':
 *         description: Sesión no encontrada
 *       '500':
 *         description: Error del servidor
 */
router.get('/api/sessions/:session', async (req: Request, res: Response) => {
  try {
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener la sesión asociada a la API key del solicitante
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;

    if (!requesterSessionName || req.params.session !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    // Proxy: obtener información de la sesión desde la API maestra
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sessions/${encodeURIComponent(req.params.session)}`;
    const headers = {
      'Accept': 'application/json',
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.get(targetUrl, {
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
    console.error('Error en GET /v1/api/sessions/{session}:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sessions/{session}/me:
 *   get:
 *     summary: Obtener identidad de la sesión
 *     description: Devuelve información del contexto "yo" de la sesión indicada, validando que coincida con la API key.
 *     tags: [🖥️ Sesion]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: session
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la sesión
 *     responses:
 *       '200':
 *         description: Información de "me" obtenida correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.get('/api/sessions/:session/me', async (req: Request, res: Response) => {
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

    // Proxy a la API maestra
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sessions/${encodeURIComponent(req.params.session)}/me`;
    const headers = {
      'Accept': 'application/json',
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.get(targetUrl, {
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
    console.error('Error en GET /v1/api/sessions/{session}/me:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

export { router as sessionsRouter };