import { Router, Request, Response } from 'express';
import axios from 'axios';
import { apiKeyAuth } from '../middleware/auth';
import { rateLimitBySession } from '../middleware/rateLimit';
import { config } from '../config';
import { prisma } from '../db/prisma';

const router = Router();

// Aplicar autenticación y rate limiting a todas las rutas de perfil
router.use(apiKeyAuth);
router.use(rateLimitBySession);

/**
 * @swagger
 * tags:
 *   - name: Perfil 🆔
 *     description: Información del perfil de la sesión
 */

/**
 * @swagger
 * /v1/api/{session}/profile:
 *   get:
 *     summary: Obtener perfil de la sesión
 *     description: Devuelve la información de perfil asociada a la sesión.
 *     tags: [Perfil 🆔]
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
 *         description: Perfil obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 picture:
 *                   type: string
 *                   format: uri
 *                 name:
 *                   type: string
 *             example:
 *               id: '11111111111@c.us'
 *               picture: 'https://example.com/picture.jpg'
 *               name: 'string'
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
  */
router.get('/api/:session/profile', async (req: Request, res: Response) => {
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

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/profile`;
    const headers = {
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
    console.error('Error en /v1/api/{session}/profile:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/profile/name:
 *   put:
 *     summary: Actualizar nombre del perfil de la sesión
 *     description: Actualiza el campo `name` del perfil asociado a la sesión.
 *     tags: [Perfil 🆔]
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
 *             properties:
 *               name:
 *                 type: string
 *           example:
 *             name: 'My New Name'
 *     responses:
 *       '200':
 *         description: Nombre actualizado correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.put('/api/:session/profile/name', async (req: Request, res: Response) => {
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

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/profile/name`;
    const headers = {
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.put(targetUrl, req.body, {
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
    console.error('Error en PUT /v1/api/{session}/profile/name:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/profile/status:
 *   put:
 *     summary: Actualizar estado del perfil de la sesión
 *     description: Actualiza el campo `status` del perfil asociado a la sesión.
 *     tags: [Perfil 🆔]
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
 *             properties:
 *               status:
 *                 type: string
 *           example:
 *             status: '🎉 Hey there! I am using WhatsApp 🎉'
 *     responses:
 *       '200':
 *         description: Estado actualizado correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.put('/api/:session/profile/status', async (req: Request, res: Response) => {
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

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/profile/status`;
    const headers = {
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.put(targetUrl, req.body, {
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
    console.error('Error en PUT /v1/api/{session}/profile/status:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/profile/picture:
 *   put:
 *     summary: Actualizar foto de perfil de la sesión
 *     description: Actualiza la foto de perfil asociada a la sesión.
 *     tags: [Perfil 🆔]
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
 *             properties:
 *               file:
 *                 type: object
 *                 properties:
 *                   mimetype:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   url:
 *                     type: string
 *                     format: uri
 *           example:
 *             file:
 *               mimetype: 'image/jpeg'
 *               filename: 'filename.jpg'
 *               url: 'https://github.com/devlikeapro/waha/raw/core/examples/waha.jpg'
 *     responses:
 *       '200':
 *         description: Foto de perfil actualizada correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.put('/api/:session/profile/picture', async (req: Request, res: Response) => {
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

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/profile/picture`;
    const headers = {
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.put(targetUrl, req.body, {
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
    console.error('Error en PUT /v1/api/{session}/profile/picture:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/profile/picture:
 *   delete:
 *     summary: Eliminar foto de perfil de la sesión
 *     description: Elimina la foto de perfil asociada a la sesión.
 *     tags: [Perfil 🆔]
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
 *         description: Foto de perfil eliminada correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.delete('/api/:session/profile/picture', async (req: Request, res: Response) => {
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

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/profile/picture`;
    const headers = {
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': String(req.ip || ''),
      'X-Original-Api-Key': String(req.apiKey || ''),
    };

    const response = await axios.delete(targetUrl, {
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
    console.error('Error en DELETE /v1/api/{session}/profile/picture:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

export { router as profileRouter };