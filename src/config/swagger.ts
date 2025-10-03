import swaggerJSDoc from 'swagger-jsdoc';

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

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Rutas donde buscar anotaciones de JSDoc
};

export const swaggerSpec = swaggerJSDoc(options);