import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../db/redis';
import { config } from '../config';

/**
 * Middleware para limitar la tasa de solicitudes por API key
 */
export async function rateLimitBySession(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key no disponible' });
    }

    // Calcular la ventana de tiempo actual (en segundos)
    const windowEpoch = Math.floor(Date.now() / 1000 / config.RATE_LIMIT_WINDOW_SEC);
    const redisKey = `rl:${apiKey}:${windowEpoch}`;
    
    // Incrementar el contador para esta ventana
    const count = await redisClient.incr(redisKey);
    
    // Establecer TTL si es la primera solicitud en esta ventana
    if (count === 1) {
      await redisClient.expire(redisKey, config.RATE_LIMIT_WINDOW_SEC);
    }
    
    // Verificar si se excedió el límite
    if (count > config.RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Límite de solicitudes excedido',
        limit: config.RATE_LIMIT_MAX_REQUESTS,
        window: config.RATE_LIMIT_WINDOW_SEC,
        reset: Math.ceil(Date.now() / 1000 / config.RATE_LIMIT_WINDOW_SEC) * config.RATE_LIMIT_WINDOW_SEC
      });
    }
    
    // Añadir headers de rate limit
    res.setHeader('X-RateLimit-Limit', config.RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.RATE_LIMIT_MAX_REQUESTS - count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 / config.RATE_LIMIT_WINDOW_SEC) * config.RATE_LIMIT_WINDOW_SEC);
    
    next();
  } catch (error) {
    console.error('Error en rate limiting:', error);
    // En caso de error, permitir la solicitud para evitar bloqueos
    next();
  }
}