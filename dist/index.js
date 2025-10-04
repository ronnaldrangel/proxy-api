"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const admin_1 = require("./routes/admin");
const chatting_1 = require("./routes/chatting");
const profile_1 = require("./routes/profile");
const groups_1 = require("./routes/groups");
const sessions_1 = require("./routes/sessions");
const healthCheck_1 = require("./services/healthCheck");
const config_1 = require("./config");
const swagger_1 = require("./config/swagger");
// Cargar variables de entorno
dotenv_1.default.config();
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
const app = (0, express_1.default)();
// Middleware básicos
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rutas
// Prefijo del proxy ahora en /v1
// Registrar perfil antes del proxy para evitar que el catch-all del proxy lo capture
app.use('/v1', profile_1.profileRouter);
// Registrar grupos antes del proxy para evitar que el catch-all del proxy lo capture
app.use('/v1', groups_1.groupsRouter);
// Registrar sesiones antes del proxy para evitar que el catch-all del proxy lo capture
app.use('/v1', sessions_1.sessionsRouter);
app.use('/v1', chatting_1.chattingRouter);
app.use('/admin', admin_1.adminRouter);
// Swagger/OpenAPI en /docs
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
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
const PORT = config_1.config.PORT || 3000;
// Verificar salud de la API maestra antes de iniciar
(0, healthCheck_1.checkMasterApiHealth)()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`${color.green}${color.bold}Servidor iniciado en puerto ${PORT}${color.reset}`);
        console.log(`${color.magenta}API Maestra verificada:${color.reset} ${config_1.config.MASTER_API_BASE_URL}`);
        console.log(`${color.cyan}Documentación OpenAPI disponible en:${color.reset} http://localhost:${PORT}/docs`);
    });
})
    .catch((error) => {
    console.error(`${color.red}${color.bold}Error al verificar la API maestra:${color.reset} ${error.message}`);
    process.exit(1);
});
