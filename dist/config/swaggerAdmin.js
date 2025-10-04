"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerAdminSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerAdminDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Wazend Admin API',
        version: '2.0.0',
        description: 'Documentación de endpoints administrativos (/admin) de Wazend API',
        contact: {
            name: 'Soporte',
        },
    },
    servers: [],
    components: {
        securitySchemes: {
            AdminApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-Master-Key',
            },
        },
        schemas: {
            Session: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', description: 'Identificador único de la sesión' },
                    apiKey: { type: 'string', description: 'API key en texto plano' },
                    sessionName: { type: 'string', description: 'Nombre descriptivo de la sesión', nullable: true },
                    status: { type: 'string', enum: ['active', 'revoked'], description: 'Estado de la sesión' },
                    createdAt: { type: 'string', format: 'date-time', description: 'Fecha de creación' },
                    updatedAt: { type: 'string', format: 'date-time', description: 'Fecha de última actualización' },
                    lastUsedAt: { type: 'string', format: 'date-time', description: 'Última vez que se usó la API key', nullable: true },
                    revokedAt: { type: 'string', format: 'date-time', description: 'Fecha de revocación', nullable: true },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string', description: 'Mensaje de error' },
                },
            },
        },
    },
};
const adminOptions = {
    swaggerDefinition: swaggerAdminDefinition,
    // Limitar el análisis exclusivamente al archivo de rutas admin para evitar cruces con /docs
    apis: ['./src/routes/admin.ts'],
};
const adminSpec = (0, swagger_jsdoc_1.default)(adminOptions);
// Mantener solo paths de /admin
adminSpec.paths = Object.fromEntries(Object.entries(adminSpec.paths || {}).filter(([path]) => String(path).startsWith('/admin')));
// Mantener solo la etiqueta Admin si existiera
if (Array.isArray(adminSpec.tags)) {
    adminSpec.tags = adminSpec.tags.filter((t) => t && t.name === 'Admin');
}
exports.swaggerAdminSpec = adminSpec;
