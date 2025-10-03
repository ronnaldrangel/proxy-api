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
const healthCheck_1 = require("./services/healthCheck");
const config_1 = require("./config");
const swagger_1 = require("./config/swagger");
// Cargar variables de entorno
dotenv_1.default.config();
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
        console.log(`Servidor iniciado en puerto ${PORT}`);
        console.log(`API Maestra verificada: ${config_1.config.MASTER_API_BASE_URL}`);
        console.log(`Documentación OpenAPI disponible en: http://localhost:${PORT}/docs`);
    });
})
    .catch((error) => {
    console.error('Error al verificar la API maestra:', error.message);
    process.exit(1);
});
