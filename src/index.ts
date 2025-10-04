import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { adminRouter } from './routes/admin';
import { chattingRouter } from './routes/chatting';
import { profileRouter } from './routes/profile';
import { groupsRouter } from './routes/groups';
import { sessionsRouter } from './routes/sessions';
import { adminDocsRouter } from './routes/adminDocs';
import { checkMasterApiHealth } from './services/healthCheck';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { prisma } from './db/prisma';

// Cargar variables de entorno
dotenv.config();

// Códigos ANSI para colorear logs en consola
const color = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

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
  app.use('/v1', chattingRouter);
  app.use('/v1', sessionsRouter);
app.use('/admin', adminRouter);

// Swagger/OpenAPI en /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Página HTML de documentación Admin desde router dedicado
app.use('/admin-docs', adminDocsRouter);

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
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /health:
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

// Manejo de 404 para rutas no encontradas en formato JSON
app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'Not Found',
    statusCode: 404,
  });
});

// Verificar salud de la API maestra antes de iniciar
checkMasterApiHealth()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`${color.green}${color.bold}Servidor iniciado en puerto ${PORT}${color.reset}`);
      console.log(`${color.magenta}API Maestra verificada:${color.reset} ${config.MASTER_API_BASE_URL}`);
      console.log(`${color.cyan}Documentación OpenAPI disponible en:${color.reset} http://localhost:${PORT}/docs`);
    });
  })
  .catch((error) => {
    console.error(`${color.red}${color.bold}Error al verificar la API maestra:${color.reset} ${error.message}`);
    process.exit(1);
  });
