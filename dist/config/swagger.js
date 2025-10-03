"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Wazend API',
        version: '2.0.0',
        description: 'WhatsApp HTTP API that you can run in a click!',
        contact: {
            name: 'Soporte',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Servidor de desarrollo',
        },
    ],
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
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Identificador único de la sesión',
                    },
                    apiKey: {
                        type: 'string',
                        description: 'API key en texto plano',
                    },
                    sessionName: {
                        type: 'string',
                        description: 'Nombre descriptivo de la sesión',
                        nullable: true,
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'revoked'],
                        description: 'Estado de la sesión',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de creación',
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de última actualización',
                    },
                    lastUsedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Última vez que se usó la API key',
                        nullable: true,
                    },
                    revokedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de revocación',
                        nullable: true,
                    },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Mensaje de error',
                    },
                },
            },
        },
    },
};
// Generar especificación desde todas las rutas y ocultar cualquier path/tag de Admin
const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.ts', './src/index.ts'],
};
const spec = (0, swagger_jsdoc_1.default)(options);
// Ocultar paths de /admin/*
spec.paths = Object.fromEntries(Object.entries(spec.paths || {}).filter(([path]) => !String(path).startsWith('/admin')));
// Ocultar tag "Admin" si existe
if (Array.isArray(spec.tags)) {
    spec.tags = spec.tags.filter((t) => t && t.name !== 'Admin');
}
exports.swaggerSpec = spec;
