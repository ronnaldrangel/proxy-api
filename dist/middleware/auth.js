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
exports.apiKeyAuth = apiKeyAuth;
const prisma_1 = require("../db/prisma");
const redis_1 = require("../db/redis");
/**
 * Middleware para autenticar solicitudes usando el header X-Api-Key
 */
function apiKeyAuth(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Obtener API key del header
            const apiKey = req.header('X-Api-Key');
            if (!apiKey) {
                return res.status(401).json({ error: 'API key no proporcionada' });
            }
            // Intentar obtener sessionId de Redis primero (si está implementado el cache)
            let sessionId = yield redis_1.redisClient.get(`auth:${apiKey}`);
            let session;
            // Si no está en cache, buscar en la base de datos
            if (!sessionId) {
                session = yield prisma_1.prisma.session.findFirst({
                    where: {
                        apiKey: apiKey,
                        status: 'active'
                    }
                });
                if (!session) {
                    return res.status(401).json({ error: 'API key inválida o sesión inactiva' });
                }
                sessionId = session.id;
                // Guardar en cache para futuras solicitudes (opcional, con TTL de 5 minutos)
                yield redis_1.redisClient.set(`auth:${apiKey}`, sessionId, { EX: 300 });
            }
            // Actualizar last_used_at
            yield prisma_1.prisma.session.update({
                where: {
                    id: sessionId
                },
                data: {
                    lastUsedAt: new Date()
                }
            });
            // Añadir contexto a la solicitud
            req.sessionId = sessionId;
            req.apiKey = apiKey;
            next();
        }
        catch (error) {
            console.error('Error en autenticación:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
}
