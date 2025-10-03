import { Pool } from 'pg';
import { config } from '../config';

// Crear pool de conexiones a PostgreSQL
const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

// Verificar conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error al conectar a PostgreSQL:', err.message);
  } else {
    console.log('Conexión a PostgreSQL establecida');
  }
});

export { pool };