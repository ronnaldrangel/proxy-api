import { PrismaClient } from '@prisma/client';

// Crear instancia de PrismaClient
const prisma = new PrismaClient();

// Verificar conexión
prisma.$connect()
  .then(() => {
    console.log('Conexión a PostgreSQL establecida con Prisma');
  })
  .catch((err) => {
    console.error('Error al conectar a PostgreSQL con Prisma:', err.message);
  });

export { prisma };