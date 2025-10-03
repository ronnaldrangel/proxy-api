import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Middleware para autenticar solicitudes admin usando el header X-Master-Key
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const masterKey = req.header('X-Master-Key');

  if (!masterKey) {
    return res.status(401).json({ error: 'Master key no proporcionada' });
  }

  if (masterKey !== config.MASTER_API_KEY) {
    return res.status(403).json({ error: 'Master key inválida' });
  }

  next();
}
