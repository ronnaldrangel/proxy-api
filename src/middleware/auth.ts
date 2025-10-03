import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { redisClient } from '../db/redis';

// Extender la interfaz Request para incluir el contexto de sesión
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      apiKey?: string;
    }
  }
}

/**
 * Middleware para autenticar solicitudes usando el header X-Api-Key
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Obtener API key del header
    const apiKey = req.header('X-Api-Key');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key no proporcionada' });
    }

    // Intentar obtener sessionId de Redis primero (si está implementado el cache)
    let sessionId = await redisClient.get(`auth:${apiKey}`);
    let session;
    
    // Si no está en cache, buscar en la base de datos
    if (!sessionId) {
      session = await prisma.session.findFirst({
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
      await redisClient.set(`auth:${apiKey}`, sessionId, { EX: 300 });
    }

    // Actualizar last_used_at
    await prisma.session.update({
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
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}