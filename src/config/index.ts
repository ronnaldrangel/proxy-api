import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/api_proxy',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MASTER_API_BASE_URL: process.env.MASTER_API_BASE_URL || 'https://edge.wazend.net',
  MASTER_API_KEY: process.env.MASTER_API_KEY || 'UkVKATZZMZqZgtxMscKhfhbxORHDH41K',
  MASTER_API_TIMEOUT_MS: parseInt(process.env.MASTER_API_TIMEOUT_MS || '30000', 10),
  RATE_LIMIT_WINDOW_SEC: parseInt(process.env.RATE_LIMIT_WINDOW_SEC || '60', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};