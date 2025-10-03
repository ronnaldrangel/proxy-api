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
const prisma_1 = require("../db/prisma");
const redis_1 = require("../db/redis");
const keys_1 = require("../services/keys");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.sessionsRouter = router;
/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Crear una nueva sesión
 *     description: Crea una nueva sesión y genera una API key en texto plano
 *     tags: [Sessions]
 *     responses:
 *       201:
 *         description: Sesión creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Generar API key en texto plano
        const apiKey = (0, keys_1.generateApiKey)();
        // Insertar en la base de datos usando Prisma
        const session = yield prisma_1.prisma.session.create({
            data: {
                apiKey,
                status: 'active',
            },
        });
        res.status(201).json(session);
    }
    catch (error) {
        console.error('Error al crear sesión:', error);
        res.status(500).json({ error: 'Error al crear sesión' });
    }
}));
/**
 * @swagger
 * /sessions/{id}/rotate:
 *   post:
 *     summary: Rotar API key de una sesión
 *     description: Genera una nueva API key para la sesión especificada
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sesión
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: API key rotada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sesión no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/rotate', auth_1.apiKeyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar que el usuario tenga acceso a esta sesión
        if (req.sessionId !== req.params.id) {
            return res.status(403).json({ error: 'No autorizado para esta sesión' });
        }
        // Generar nueva API key
        const newApiKey = (0, keys_1.generateApiKey)();
        // Actualizar en la base de datos usando Prisma
        const session = yield prisma_1.prisma.session.update({
            where: {
                id: req.params.id,
            },
            data: {
                apiKey: newApiKey,
                updatedAt: new Date(),
            },
        });
        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }
        // Invalidar cache de Redis
        yield redis_1.redisClient.del(`auth:${req.apiKey}`);
        res.status(200).json(session);
    }
    catch (error) {
        console.error('Error al rotar API key:', error);
        res.status(500).json({ error: 'Error al rotar API key' });
    }
}));
/**
 * @swagger
 * /sessions/{id}/revoke:
 *   post:
 *     summary: Revocar una sesión
 *     description: Marca una sesión como revocada
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la sesión
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Sesión revocada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Sesión no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/revoke', auth_1.apiKeyAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verificar que el usuario tenga acceso a esta sesión
        if (req.sessionId !== req.params.id) {
            return res.status(403).json({ error: 'No autorizado para esta sesión' });
        }
        // Marcar como revocada en la base de datos usando Prisma
        const session = yield prisma_1.prisma.session.update({
            where: {
                id: req.params.id,
            },
            data: {
                status: 'revoked',
                revokedAt: new Date(),
            },
        });
        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }
        // Invalidar cache de Redis
        yield redis_1.redisClient.del(`auth:${req.apiKey}`);
        res.status(200).json(session);
    }
    catch (error) {
        console.error('Error al revocar sesión:', error);
        res.status(500).json({ error: 'Error al revocar sesión' });
    }
}));
