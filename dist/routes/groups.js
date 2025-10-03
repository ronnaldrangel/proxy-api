"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupsRouter = void 0;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const config_1 = require("../config");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
exports.groupsRouter = router;
// Aplicar autenticación y rate limiting a todas las rutas de grupos
router.use(auth_1.apiKeyAuth);
router.use(rateLimit_1.rateLimitBySession);
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
router.post('/api/:session/groups', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.post(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en POST /v1/api/{session}/groups:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
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
router.put('/api/:session/groups/:id/subject', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Validación del body: subject requerido y debe ser string
        const subject = (_a = req.body) === null || _a === void 0 ? void 0 : _a.subject;
        if (typeof subject !== 'string') {
            return res.status(400).json({ error: "El campo 'subject' es requerido y debe ser string" });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/subject`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.put(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en PUT /v1/api/{session}/groups/{id}/subject:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
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
router.put('/api/:session/groups/:id/description', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Validación del body: description requerido y debe ser string
        const description = (_a = req.body) === null || _a === void 0 ? void 0 : _a.description;
        if (typeof description !== 'string') {
            return res.status(400).json({ error: "El campo 'description' es requerido y debe ser string" });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/description`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.put(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en PUT /v1/api/{session}/groups/{id}/description:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
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
router.post('/api/:session/groups/:id/participants/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Sin validación del body explícita; se proxya tal cual
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/participants/add`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.post(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en POST /v1/api/{session}/groups/{id}/participants/add:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
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
router.post('/api/:session/groups/:id/participants/remove', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Sin validación del body explícita; se proxya tal cual
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/participants/remove`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.post(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en POST /v1/api/{session}/groups/{id}/participants/remove:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
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
router.post('/api/:session/groups/:id/admin/promote', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Sin validación del body explícita; se proxya tal cual a la API maestra
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/admin/promote`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.post(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en POST /v1/api/{session}/groups/{id}/admin/promote:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
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
router.post('/api/:session/groups/:id/admin/demote', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Sin validación del body explícita; se proxya tal cual a la API maestra
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/admin/demote`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.post(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en POST /v1/api/{session}/groups/{id}/admin/demote:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
/**
 * @swagger
 * /v1/api/{session}/groups/{id}/participants:
 *   get:
 *     summary: Listar participantes del grupo
 *     description: Obtiene la lista de participantes del grupo indicado.
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
 *     responses:
 *       '200':
 *         description: Lista de participantes obtenida correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.get('/api/:session/groups/:id/participants', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/participants`;
        const headers = {
            'Accept': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.get(targetUrl, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en GET /v1/api/{session}/groups/{id}/participants:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
/**
 * @swagger
 * /v1/api/{session}/groups/{id}:
 *   get:
 *     summary: Obtener información del grupo
 *     description: Devuelve los detalles del grupo indicado.
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
 *     responses:
 *       '200':
 *         description: Información del grupo obtenida correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.get('/api/:session/groups/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}`;
        const headers = {
            'Accept': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.get(targetUrl, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en GET /v1/api/{session}/groups/{id}:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
/**
 * @swagger
 * /v1/api/{session}/groups/{id}:
 *   delete:
 *     summary: Eliminar grupo
 *     description: Elimina el grupo indicado.
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
 *     responses:
 *       '200':
 *         description: Grupo eliminado correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.delete('/api/:session/groups/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}`;
        const headers = {
            'Accept': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.delete(targetUrl, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en DELETE /v1/api/{session}/groups/{id}:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
/**
 * @swagger
 * /v1/api/{session}/groups/{id}/leave:
 *   post:
 *     summary: Abandonar grupo
 *     description: El usuario asociado a la sesión abandona el grupo indicado.
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
 *     responses:
 *       '200':
 *         description: Grupo abandonado correctamente
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.post('/api/:session/groups/:id/leave', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/${encodeURIComponent(req.params.session)}/groups/${encodeURIComponent(req.params.id)}/leave`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': config_1.config.MASTER_API_KEY,
            'X-Forwarded-For': String(req.ip || ''),
            'X-Original-Api-Key': String(req.apiKey || ''),
        };
        const response = yield axios_1.default.post(targetUrl, req.body, {
            headers,
            timeout: config_1.config.MASTER_API_TIMEOUT_MS,
            responseType: 'json',
            validateStatus: () => true,
        });
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.status(response.status).send(response.data);
    }
    catch (error) {
        console.error('Error en POST /v1/api/{session}/groups/{id}/leave:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
