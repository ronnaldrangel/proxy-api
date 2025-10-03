import { createClient } from 'redis';
import { config } from '../config';

// Crear cliente Redis
const redisClient = createClient({
  url: config.REDIS_URL,
});

// Manejar eventos de conexión
redisClient.on('connect', () => {
  console.log('Conexión a Redis establecida');
});

redisClient.on('error', (err) => {
  console.error('Error de conexión a Redis:', err);
});

// Conectar a Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Error al conectar a Redis:', error);
  }
})();

export { redisClient };