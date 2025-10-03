import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { adminRouter } from './routes/admin';
import { proxyRouter } from './routes/proxy';
import { profileRouter } from './routes/profile';
import { groupsRouter } from './routes/groups';
import { checkMasterApiHealth } from './services/healthCheck';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { prisma } from './db/prisma';

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();

// Middleware básicos
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas
// Prefijo del proxy ahora en /v1
  // Registrar perfil antes del proxy para evitar que el catch-all del proxy lo capture
  app.use('/v1', profileRouter);
  // Registrar grupos antes del proxy para evitar que el catch-all del proxy lo capture
  app.use('/v1', groupsRouter);
  app.use('/v1', proxyRouter);
app.use('/admin', adminRouter);

// Swagger/OpenAPI en /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Welcome to Wazend API, it is working!',
    version: '2.0',
    manager: 'http://app.wazend.net/',
    documentation: '/docs',
  });
});

// Ruta de salud
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Verificar estado del servicio
 *     description: Devuelve el estado del servicio y timestamp
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

// Iniciar servidor
const PORT = config.PORT || 3000;

// Verificar salud de la API maestra antes de iniciar
checkMasterApiHealth()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en puerto ${PORT}`);
      console.log(`API Maestra verificada: ${config.MASTER_API_BASE_URL}`);
      console.log(`Documentación OpenAPI disponible en: http://localhost:${PORT}/docs`);
    });
  })
  .catch((error) => {
    console.error('Error al verificar la API maestra:', error.message);
    process.exit(1);
  });