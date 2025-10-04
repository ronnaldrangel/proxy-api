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
exports.sessionsRouter = void 0;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const config_1 = require("../config");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
exports.sessionsRouter = router;
// Autenticación por API key y rate limiting por sesión
router.use(auth_1.apiKeyAuth);
router.use(rateLimit_1.rateLimitBySession);
/**
 * @swagger
 * tags:
 *   - name: 🖥️ Sesion
 *     description: Operaciones e información de la sesión
 */
/**
 * @swagger
 * /v1/api/sessions/{session}:
 *   get:
 *     summary: Obtener información general de la sesión
 *     description: Devuelve información pública asociada a la sesión autenticada.
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
 *             example:
 *               id: '11111111111@c.us'
 *               name: 'Mi sesión'
 *               state: 'connected'
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.get('/api/sessions/:session', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/sessions/${encodeURIComponent(req.params.session)}`;
        const headers = {
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
        console.error('Error en GET /v1/api/sessions/{session}:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
/**
 * @swagger
 * /v1/api/sessions/{session}/me:
 *   get:
 *     summary: Obtener contexto "me" de la sesión
 *     description: Devuelve información pública relacionada al contexto "me" de la sesión autenticada.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               id: '11111111111@c.us'
 *               name: 'Mi sesión'
 *       '401':
 *         description: No autenticado
 *       '403':
 *         description: La sesión del path no coincide con la API key
 *       '502':
 *         description: Error al comunicarse con la API maestra
 */
router.get('/api/sessions/:session/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const targetUrl = `${config_1.config.MASTER_API_BASE_URL}/api/sessions/${encodeURIComponent(req.params.session)}/me`;
        const headers = {
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
        console.error('Error en GET /v1/api/sessions/{session}/me:', error);
        res.status(502).json({ error: 'Error al comunicarse con la API maestra' });
    }
}));
