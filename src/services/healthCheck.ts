import axios from 'axios';
import { config } from '../config';

/**
 * Verifica la salud de la API maestra al iniciar el servidor
 * Hace un GET a https://edge.wazend.net/health con el header X-Api-Key
 */
export async function checkMasterApiHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${config.MASTER_API_BASE_URL}/health`, {
      headers: {
        'X-Api-Key': config.MASTER_API_KEY
      },
      timeout: 5000 // 5 segundos de timeout
    });

    if (response.status >= 200 && response.status < 300) {
      console.log('API Maestra está en línea y funcionando correctamente');
      return true;
    } else {
      throw new Error(`API Maestra respondió con estado: ${response.status}`);
    }
  } catch (error) {
    console.error('Error al verificar la API maestra:', error);
    throw new Error('No se pudo verificar la salud de la API maestra');
  }
}

// Inicia un heartbeat periódico para mantener “caliente” la API maestra y detectar caídas.
export function startMasterApiHeartbeat(): void {
  const intervalMs = Math.max(60000, Number(config.HEARTBEAT_INTERVAL_MS || 240000));

  setInterval(async () => {
    try {
      await axios.get(`${config.MASTER_API_BASE_URL}/health`, {
        headers: {
          'X-Api-Key': config.MASTER_API_KEY,
        },
        timeout: 5000,
      });
      // No hacer log en éxito para evitar ruido; solo registramos errores.
    } catch (error: any) {
      const msg = (error && error.message) ? error.message : String(error);
      console.error('Heartbeat: fallo al consultar /health de API maestra:', msg);
    }
  }, intervalMs);
}