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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
exports.sessionsRouter = router;
// Aplicar autenticación y rate limiting a todas las rutas de sesión
router.use(auth_1.apiKeyAuth);
router.use(rateLimit_1.rateLimitBySession);
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
router.get('/api/sessions/:session', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requesterSessionId = req.sessionId;
        if (!requesterSessionId) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        // Obtener la sesión asociada a la API key del solicitante
        const dbSession = yield prisma_1.prisma.session.findUnique({ where: { id: requesterSessionId } });
        const requesterSessionName = (dbSession === null || dbSession === void 0 ? void 0 : dbSession.sessionName) || null;
        if (!requesterSessionName || req.params.session !== requesterSessionName) {
            return res.status(403).json({ error: 'La sesión enviada no coincide con la sesión de la API key' });
        }
        // Devolver información pública de la sesión
        const rows = yield prisma_1.prisma.$queryRaw `
      SELECT
        id,
        session_name AS "sessionName",
        status,
        created_at   AS "createdAt",
        updated_at   AS "updatedAt",
        last_used_at AS "lastUsedAt",
        revoked_at   AS "revokedAt"
      FROM sessions
      WHERE id = ${requesterSessionId}
      LIMIT 1
    `;
        const session = rows[0];
        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }
        res.json(session);
    }
    catch (error) {
        console.error('Error en GET /v1/api/sessions/{session}:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
}));
