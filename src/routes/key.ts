import { Router, Request, Response } from 'express';
import { apiKeyAuth } from '../middleware/auth';
import { rateLimitBySession } from '../middleware/rateLimit';

const router = Router();

// Validar todas las solicitudes con X-Api-Key y aplicar rate limiting
router.use(apiKeyAuth);
router.use(rateLimitBySession);

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
router.get('/key', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', sessionId: req.sessionId });
});

export { router as keyRouter };