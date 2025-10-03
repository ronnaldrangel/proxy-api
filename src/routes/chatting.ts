import { Router, Request, Response } from 'express';
import axios from 'axios';
import { apiKeyAuth } from '../middleware/auth';
import { rateLimitBySession } from '../middleware/rateLimit';
import { config } from '../config';
import { prisma } from '../db/prisma';

const router = Router();

// Aplicar middleware de autenticación y rate limiting a todas las rutas del proxy
router.use(apiKeyAuth);
router.use(rateLimitBySession);

/**
 * @swagger
 * /v1/api/reaction:
 *   put:
 *     summary: Reaccionar a mensaje
 *     description: Envía una reacción a un mensaje existente.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messageId, reaction, session]
 *             properties:
 *               messageId:
 *                 type: string
 *               reaction:
 *                 type: string
 *               session:
 *                 type: string
 *           example:
 *             messageId: "false_11111111111@c.us_AAAAAAAAAAAAAAAAAAAA"
 *             reaction: "👍"
 *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.put('/api/reaction', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/reaction`;
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
    console.error('Error en /v1/api/reaction:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});
/**
 * @swagger
 * tags:
 *   - name: 📤 Chatear
 *     description: Operaciones de envío de mensajes
 */

/**
 * @swagger
 * /v1/api/sendText:
 *   post:
 *     summary: Enviar texto
 *     description: Envía un mensaje de texto vía API.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, text, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               reply_to:
 *                 type: string
 *                 nullable: true
 *               text:
 *                 type: string
 *               linkPreview:
 *                 type: boolean
 *               linkPreviewHighQuality:
 *                 type: boolean
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             reply_to: null
  *             text: "Hi there!"
  *             linkPreview: true
  *             linkPreviewHighQuality: false
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendText', async (req: Request, res: Response) => {
  try {
    // Validar que 'session' del body coincide con el sessionName de la API key
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    // Reenvío a la API maestra con body en JSON
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendText`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': config.MASTER_API_KEY,
      'X-Forwarded-For': req.ip,
      'X-Original-Api-Key': req.apiKey,
    };

    const response = await axios.post(targetUrl, req.body, {
      headers,
      timeout: config.MASTER_API_TIMEOUT_MS,
      responseType: 'json',
      validateStatus: () => true
    });

    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value as any);
    });
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error en /v1/api/sendText:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendImage:
 *   post:
 *     summary: Enviar imagen
 *     description: Envía una imagen vía API.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, file, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               file:
 *                 type: object
 *                 required: [mimetype, filename, url]
 *                 properties:
 *                   mimetype:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   url:
 *                     type: string
 *               reply_to:
 *                 type: string
 *                 nullable: true
 *               asNote:
 *                 type: boolean
 *               convert:
 *                 type: boolean
 *               caption:
 *                 type: string
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             file:
  *               mimetype: "image/jpeg"
  *               filename: "filename.jpg"
  *               url: "https://github.com/devlikeapro/waha/raw/core/examples/waha.jpg"
  *             reply_to: null
  *             caption: "string"
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendImage', async (req: Request, res: Response) => {
  try {
    // Validar que 'session' del body coincide con el sessionName de la API key
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    // Sin validación adicional del objeto 'file': se reenvía tal cual

    // Reenvío a la API maestra con body en JSON
    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendImage`;
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
      validateStatus: () => true
    });

    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value as any);
    });
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error en /v1/api/sendImage:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendFile:
 *   post:
 *     summary: Enviar archivo
 *     description: Envía un archivo genérico vía API.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, file, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               file:
 *                 type: object
 *                 properties:
 *                   mimetype:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   url:
 *                     type: string
  *               reply_to:
  *                 type: string
  *                 nullable: true
 *               caption:
 *                 type: string
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             file:
  *               mimetype: "image/jpeg"
  *               filename: "filename.jpg"
  *               url: "https://github.com/devlikeapro/waha/raw/core/examples/waha.jpg"
  *             reply_to: null
  *             caption: "string"
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendFile', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendFile`;
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
    console.error('Error en /v1/api/sendFile:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendVideo:
 *   post:
 *     summary: Enviar video
 *     description: Envía un video vía API.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, file, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               file:
 *                 type: object
 *                 required: [mimetype, filename, url]
 *                 properties:
 *                   mimetype:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   url:
 *                     type: string
 *               reply_to:
 *                 type: string
 *                 nullable: true
 *               caption:
 *                 type: string
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             file:
  *               mimetype: "video/mp4"
  *               filename: "video.mp4"
  *               url: " `https://github.com/devlikeapro/waha/raw/core/examples/video.mp4` "
  *             reply_to: null
  *             asNote: false
  *             convert: true
  *             caption: "Just watch at this!"
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendVideo', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendVideo`;
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
    console.error('Error en /v1/api/sendVideo:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendVoice:
 *   post:
 *     summary: Enviar audio/voz
 *     description: Envía un audio/nota de voz vía API.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, file, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               file:
 *                 type: object
 *                 properties:
 *                   mimetype:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   url:
 *                     type: string
  *               reply_to:
  *                 type: string
  *                 nullable: true
  *               convert:
  *                 type: boolean
 *               ptt:
 *                 type: boolean
 *                 description: Enviar como nota de voz (push-to-talk)
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             file:
  *               mimetype: "audio/ogg; codecs=opus"
  *               url: "https://github.com/devlikeapro/waha/raw/core/examples/dev.likeapro.opus"
  *             reply_to: null
  *             convert: true
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendVoice', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendVoice`;
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
    console.error('Error en /v1/api/sendVoice:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});


/**
 * @swagger
 * /v1/api/sendList:
 *   post:
 *     summary: Enviar lista
 *     description: Envía un mensaje de lista interactiva.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, message, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               message:
 *                 type: object
 *                 description: Estructura de lista (título, botón, secciones, etc.)
 *               reply_to:
 *                 type: string
 *                 nullable: true
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             message:
  *               title: "Simple Menu"
  *               description: "Please choose an option"
  *               footer: "Thank you!"
  *               button: "Choose"
  *               sections:
  *                 - title: "Main"
  *                   rows:
  *                     - title: "Option 1"
  *                       rowId: "option1"
  *                       description: null
  *                     - title: "Option 2"
  *                       rowId: "option2"
  *                       description: null
  *                     - title: "Option 3"
  *                       rowId: "option3"
  *                       description: null
  *             reply_to: null
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendList', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendList`;
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
    console.error('Error en /v1/api/sendList:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendContactVcard:
 *   post:
 *     summary: Enviar contacto vCard
 *     description: Envía un contacto en formato vCard.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, contacts, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     vcard:
 *                       type: string
 *                       nullable: true
 *                       description: Contenido de la vCard (VCF)
 *                     fullName:
 *                       type: string
 *                     organization:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     whatsappId:
 *                       type: string
 *               reply_to:
 *                 type: string
 *                 nullable: true
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             contacts:
  *               - vcard: |
  *                   BEGIN:VCARD
  *                   VERSION:3.0
  *                   FN:Jane Doe
  *                   ORG:Company Name;
  *                   TEL;type=CELL;type=VOICE;waid=911111111111:+91 11111 11111
  *                   END:VCARD
  *               - fullName: "John Doe"
  *                 organization: "Company Name"
  *                 phoneNumber: "+91 11111 11111"
  *                 whatsappId: "911111111111"
  *                 vcard: null
  *             reply_to: null
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendContactVcard', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendContactVcard`;
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
    console.error('Error en /v1/api/sendContactVcard:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendPoll:
 *   post:
 *     summary: Enviar encuesta
 *     description: Envía una encuesta/poll.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, poll, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               poll:
 *                 type: object
 *                 description: Estructura de la encuesta (título, opciones, etc.)
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             reply_to: null
  *             poll:
  *               name: "How are you?"
  *               options:
  *                 - "Awesome!"
  *                 - "Good!"
  *                 - "Not bad!"
  *               multipleAnswers: false
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendPoll', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendPoll`;
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
    console.error('Error en /v1/api/sendPoll:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});

/**
 * @swagger
 * /v1/api/sendLocation:
 *   post:
 *     summary: Enviar ubicación
 *     description: Envía una ubicación con latitud/longitud.
 *     tags: [📤 Chatear]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, location, session]
 *             properties:
 *               chatId:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *               session:
 *                 type: string
  *           example:
  *             chatId: "11111111111@c.us"
  *             latitude: 38.8937255
  *             longitude: -77.0969763
  *             title: "Our office"
  *             reply_to: null
  *             session: "default"
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Body inválido
 *       '401':
 *         description: No autorizado
 *       '403':
 *         description: La sesión del body no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/sendLocation', async (req: Request, res: Response) => {
  try {
    const bodySession = req.body?.session;
    const requesterSessionId = req.sessionId;
    if (!requesterSessionId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (typeof bodySession !== 'string') {
      return res.status(400).json({ error: "El campo 'session' es requerido y debe ser string" });
    }
    const dbSession = await prisma.session.findUnique({ where: { id: requesterSessionId } });
    const requesterSessionName = dbSession?.sessionName || null;
    if (!requesterSessionName || bodySession !== requesterSessionName) {
      return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
    }

    const targetUrl = `${config.MASTER_API_BASE_URL}/api/sendLocation`;
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
    console.error('Error en /v1/api/sendLocation:', error);
    res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
  }
});
export { router as chattingRouter };
