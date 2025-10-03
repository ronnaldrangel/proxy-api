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
exports.rateLimitBySession = rateLimitBySession;
const redis_1 = require("../db/redis");
const config_1 = require("../config");
/**
 * Middleware para limitar la tasa de solicitudes por API key
 */
function rateLimitBySession(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const apiKey = req.apiKey;
            if (!apiKey) {
                return res.status(401).json({ error: 'API key no disponible' });
            }
            // Calcular la ventana de tiempo actual (en segundos)
            const windowEpoch = Math.floor(Date.now() / 1000 / config_1.config.RATE_LIMIT_WINDOW_SEC);
            const redisKey = `rl:${apiKey}:${windowEpoch}`;
            // Incrementar el contador para esta ventana
            const count = yield redis_1.redisClient.incr(redisKey);
            // Establecer TTL si es la primera solicitud en esta ventana
            if (count === 1) {
                yield redis_1.redisClient.expire(redisKey, config_1.config.RATE_LIMIT_WINDOW_SEC);
            }
            // Verificar si se excedió el límite
            if (count > config_1.config.RATE_LIMIT_MAX_REQUESTS) {
                return res.status(429).json({
                    error: 'Límite de solicitudes excedido',
                    limit: config_1.config.RATE_LIMIT_MAX_REQUESTS,
                    window: config_1.config.RATE_LIMIT_WINDOW_SEC,
                    reset: Math.ceil(Date.now() / 1000 / config_1.config.RATE_LIMIT_WINDOW_SEC) * config_1.config.RATE_LIMIT_WINDOW_SEC
                });
            }
            // Añadir headers de rate limit
            res.setHeader('X-RateLimit-Limit', config_1.config.RATE_LIMIT_MAX_REQUESTS);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, config_1.config.RATE_LIMIT_MAX_REQUESTS - count));
            res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 / config_1.config.RATE_LIMIT_WINDOW_SEC) * config_1.config.RATE_LIMIT_WINDOW_SEC);
            next();
        }
        catch (error) {
            console.error('Error en rate limiting:', error);
            // En caso de error, permitir la solicitud para evitar bloqueos
            next();
        }
    });
}
