import crypto from 'crypto';

/**
 * Genera una API key aleatoria
 * @returns API key en texto plano
 */
export function generateApiKey(): string {
  // Generar 32 bytes aleatorios y convertirlos a hexadecimal
  return crypto.randomBytes(32).toString('hex');
}