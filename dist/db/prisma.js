"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Crear instancia de PrismaClient
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
// Verificar conexión
prisma.$connect()
    .then(() => {
    console.log('Conexión a PostgreSQL establecida con Prisma');
})
    .catch((err) => {
    console.error('Error al conectar a PostgreSQL con Prisma:', err.message);
});
