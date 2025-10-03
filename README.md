# API Proxy

API Proxy que utiliza una clave maestra para la API principal y genera claves únicas para cada sesión.

## Características

- Autenticación mediante API keys en texto plano (sin cifrado)
- Proxy hacia API maestra (https://edge.wazend.net/)
- Rate limiting por sesión
- Rotación de API keys
- Verificación de salud de la API maestra al iniciar

## Requisitos

- Node.js v14+
- PostgreSQL
- Redis

## Configuración

1. Copia `.env.example` a `.env` y configura las variables de entorno:

```
# Puerto del servidor
PORT=3000

# Conexión a PostgreSQL
DATABASE_URL=postgres://usuario:contraseña@host:puerto/base_datos

# Conexión a Redis
REDIS_URL=redis://host:puerto

# API Maestra
MASTER_API_BASE_URL=https://edge.wazend.net
MASTER_API_KEY=UkVKATZZMZqZgtxMscKhfhbxORHDH41K

# Configuración de Rate Limiting
RATE_LIMIT_WINDOW_SEC=60
RATE_LIMIT_MAX_REQUESTS=100
```

2. Crea la tabla en PostgreSQL:

```sql
-- Ejecuta el script en sql/init.sql
```

## Instalación

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

## Endpoints

- `POST /sessions` - Crear nueva sesión y obtener API key
- `POST /sessions/:id/rotate` - Rotar API key de una sesión
- `POST /sessions/:id/revoke` - Revocar una sesión
 - `ALL /v1/*` - Proxy hacia la API maestra
- `GET /healthz` - Estado del servicio

## Uso

Para usar el proxy, envía tus solicitudes a `/v1/*` con el header `X-Api-Key` conteniendo la API key de la sesión.

Ejemplo:

```bash
# Crear una sesión
curl -X POST http://localhost:3000/sessions

# Usar el proxy
curl -X GET http://localhost:3000/v1/alguna-ruta -H "X-Api-Key: tu-api-key"
```