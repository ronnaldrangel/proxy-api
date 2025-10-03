"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
// Crear pool de conexiones a PostgreSQL
const pool = new pg_1.Pool({
    connectionString: config_1.config.DATABASE_URL,
});
exports.pool = pool;
// Verificar conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error al conectar a PostgreSQL:', err.message);
    }
    else {
        console.log('Conexión a PostgreSQL establecida');
    }
});
