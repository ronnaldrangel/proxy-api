"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
exports.keyRouter = router;
// Validar todas las solicitudes con X-Api-Key y aplicar rate limiting
router.use(auth_1.apiKeyAuth);
router.use(rateLimit_1.rateLimitBySession);
/**
 * @swagger
 * tags:
 *   - name: 🔑 Key
 *     description: Validación rápida de la API key
 */
/**
 * @swagger
 * /v1/key:
 *   get:
 *     summary: Validar X-Api-Key
 *     description: Valida la API key y devuelve el sessionId asociado.
 *     tags: [🔑 Key]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       '200':
 *         description: API key válida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 sessionId:
 *                   type: string
 *       '401':
 *         description: API key no proporcionada o inválida
 */
router.get('/key', (req, res) => {
    res.status(200).json({ status: 'ok', sessionId: req.sessionId });
});
