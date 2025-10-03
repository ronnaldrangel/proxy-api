-- Crear tabla de sesiones con API key en texto plano
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(10) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Crear índice para búsqueda rápida por API key
CREATE INDEX IF NOT EXISTS idx_sessions_api_key ON sessions(api_key);

-- Crear índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Comentario: Las API keys se almacenan en texto plano según requerimiento