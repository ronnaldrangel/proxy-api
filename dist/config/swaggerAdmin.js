"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerAdminSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Wazend Admin API',
        version: '2.0.0',
        description: 'Documentación sencilla de endpoints administrativos (/admin) para gestión de sesiones.',
        contact: {
            name: 'Soporte',
        },
    },
    servers: [],
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-Api-Key',
            },
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
                    id: { type: 'string', format: 'uuid', description: 'ID de la sesión' },
                    apiKey: { type: 'string', description: 'API key en texto plano' },
                    sessionName: { type: 'string', nullable: true, description: 'Nombre de la sesión' },
                    status: { type: 'string', enum: ['active', 'revoked'], description: 'Estado' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                    revokedAt: { type: 'string', format: 'date-time', nullable: true },
                },
            },
            Error: {
                type: 'object',
                properties: { error: { type: 'string' } },
            },
        },
    },
};
// Generar especificación sólo desde rutas admin
const options = {
    swaggerDefinition,
    apis: ['./src/routes/admin.ts'],
};
const adminSpec = (0, swagger_jsdoc_1.default)(options);
// Asegurar que sólo aparezcan paths bajo /admin y el tag Admin
adminSpec.paths = Object.fromEntries(Object.entries(adminSpec.paths || {}).filter(([path]) => String(path).startsWith('/admin')));
exports.swaggerAdminSpec = adminSpec;
