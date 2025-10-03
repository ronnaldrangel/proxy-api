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

/**
 * @swagger
 * /v1/api/{session}/groups/{id}/subject:
 *   put:
 *     summary: Actualizar asunto del grupo
 *     description: Cambia el `subject` (nombre) del grupo indicado.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject]
 *             properties:
 *               subject:
 *                 type: string
 *           example:
 *             subject: "string"
 *     responses:
 *       '200':
 *         description: Asunto actualizado correctamente
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.put('/api/:session/groups/:id/subject', async (req: Request, res: Response) => {
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

    // Validación del body: subject requerido y debe ser string
    const subject = (req.body as any)?.subject;
    if (typeof subject !== 'string') {
      return res.status(400).json({ error: "El campo 'subject' es requerido y debe ser string" });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/subject`;
    const headers = {
      'Content-Type': 'application/json',
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
    console.error('Error en PUT /v1/api/{session}/groups/{id}/subject:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/groups/{id}/description:
 *   put:
 *     summary: Actualizar descripción del grupo
 *     description: Cambia la `description` del grupo indicado.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description:
 *                 type: string
 *           example:
 *             description: "string"
 *     responses:
 *       '200':
 *         description: Descripción actualizada correctamente
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.put('/api/:session/groups/:id/description', async (req: Request, res: Response) => {
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

    // Validación del body: description requerido y debe ser string
    const description = (req.body as any)?.description;
    if (typeof description !== 'string') {
      return res.status(400).json({ error: "El campo 'description' es requerido y debe ser string" });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/description`;
    const headers = {
      'Content-Type': 'application/json',
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
    console.error('Error en PUT /v1/api/{session}/groups/{id}/description:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/groups/{id}/participants/add:
 *   post:
 *     summary: Agregar participantes al grupo
 *     description: Agrega uno o más participantes al grupo indicado.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *           example:
 *             participants:
 *               - id: "123456789@c.us"
 *     responses:
 *       '200':
 *         description: Participantes agregados correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/:session/groups/:id/participants/add', async (req: Request, res: Response) => {
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

    // Sin validación del body explícita; se proxya tal cual
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/participants/add`;
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
    console.error('Error en POST /v1/api/{session}/groups/{id}/participants/add:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/groups/{id}/participants/remove:
 *   post:
 *     summary: Remover participantes del grupo
 *     description: Elimina uno o más participantes del grupo indicado.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *           example:
 *             participants:
 *               - id: "123456789@c.us"
 *     responses:
 *       '200':
 *         description: Participantes removidos correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/:session/groups/:id/participants/remove', async (req: Request, res: Response) => {
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

    // Sin validación del body explícita; se proxya tal cual
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/participants/remove`;
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
    console.error('Error en POST /v1/api/{session}/groups/{id}/participants/remove:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/groups/{id}/admin/promote:
 *   post:
 *     summary: Promover participantes a administradores
 *     description: Promueve uno o más participantes del grupo indicado al rol de administrador.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *           example:
 *             participants:
 *               - id: "123456789@c.us"
 *     responses:
 *       '200':
 *         description: Participantes promovidos correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/:session/groups/:id/admin/promote', async (req: Request, res: Response) => {
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

    // Sin validación del body explícita; se proxya tal cual a la API maestra
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/admin/promote`;
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
    console.error('Error en POST /v1/api/{session}/groups/{id}/admin/promote:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/{session}/groups/{id}/admin/demote:
 *   post:
 *     summary: Degradar administradores a participantes
 *     description: Degrada uno o más administradores del grupo indicado al rol de participante.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *           example:
 *             participants:
 *               - id: "123456789@c.us"
 *     responses:
 *       '200':
 *         description: Administradores degradados correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/:session/groups/:id/admin/demote', async (req: Request, res: Response) => {
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

    // Sin validación del body explícita; se proxya tal cual a la API maestra
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/admin/demote`;
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
    console.error('Error en POST /v1/api/{session}/groups/{id}/admin/demote:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

export { router as groupsRouter };
