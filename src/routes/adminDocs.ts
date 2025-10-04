import { Router, Request, Response } from 'express';

const router = Router();

// HTML breve tipo guía (sin YAML), con diseño amigable
const PAGE_HTML = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Wazend API — Guía Admin</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; }
    .header { background: linear-gradient(135deg, #6E8EF7 0%, #A777E3 100%); color: #fff; padding: 36px 24px; }
    .container { max-width: 880px; margin: -20px auto 36px; padding: 0 24px; }
    .card { background: rgba(255,255,255,0.9); backdrop-filter: blur(6px); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
    .section { padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .section:last-child { border-bottom: none; }
    h1 { margin: 0; font-size: 1.7rem; }
    h2 { margin: 0; font-size: 1.2rem; color: #222; }
    p { margin: 8px 0 0; }
    ul { list-style: none; padding: 0; margin: 12px 0 0; }
    li { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px dashed rgba(0,0,0,0.08); }
    li:last-child { border-bottom: none; }
    .method { font-weight: 700; font-size: 0.85rem; padding: 6px 10px; border-radius: 999px; }
    .GET { background: #E8F5E9; color: #2E7D32; }
    .POST { background: #E3F2FD; color: #1565C0; }
    .DELETE { background: #FFEBEE; color: #C62828; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.95rem; }
    .desc { color: #555; }
    .box { background: rgba(0,0,0,0.05); border-radius: 12px; padding: 12px; margin-top: 10px; }
    .footer { text-align: center; color: #777; font-size: 0.9rem; padding: 14px; }
    @media (prefers-color-scheme: dark) {
      .card { background: rgba(20,20,20,0.9); box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
      h2 { color: #f4f4f4; }
      .desc { color: #aaa; }
      .box { background: rgba(255,255,255,0.06); }
      .footer { color: #aaa; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Wazend API — Guía Admin</h1>
    <p style="max-width: 720px;">Resumen breve de endpoints administrativos. Autenticación requerida: <code>X-Master-Key</code>.</p>
  </div>
  <div class="container">
    <div class="card">
      <div class="section">
        <h2>Autenticación</h2>
        <div class="box"><code>X-Master-Key: &lt;tu-master-key&gt;</code></div>
      </div>
      <div class="section">
        <h2>Endpoints</h2>
        <ul>
          <li>
            <span class="method GET">GET</span>
            <code>/admin/sessions</code>
            <span class="desc">Lista sesiones (query: <code>page</code>, <code>pageSize</code>)</span>
          </li>
          <li>
            <span class="method POST">POST</span>
            <code>/admin/sessions</code>
            <span class="desc">Crea sesión (body: <code>{ sessionName: string }</code>)</span>
          </li>
          <li>
            <span class="method GET">GET</span>
            <code>/admin/sessions/{id}</code>
            <span class="desc">Obtiene sesión por ID</span>
          </li>
          <li>
            <span class="method POST">POST</span>
            <code>/admin/sessions/{id}/rotate</code>
            <span class="desc">Rota la API key</span>
          </li>
          <li>
            <span class="method POST">POST</span>
            <code>/admin/sessions/{id}/revoke</code>
            <span class="desc">Revoca la sesión</span>
          </li>
          <li>
            <span class="method DELETE">DELETE</span>
            <code>/admin/sessions/{id}</code>
            <span class="desc">Elimina la sesión</span>
          </li>
        </ul>
      </div>
      <div class="section">
        <h2>Ejemplo rápido</h2>
        <div class="box"><code>curl -H "X-Master-Key: &lt;key&gt;" http://localhost:3000/admin/sessions?page=1</code></div>
      </div>
      <div class="footer">Para documentación pública visita <a href="/docs" style="color:#6E8EF7; text-decoration:none; font-weight:600;">/docs</a>.</div>
    </div>
  </div>
</body>
</html>`;

router.get('/', (_req: Request, res: Response) => {
  res.status(200).type('html').send(PAGE_HTML);
});

export { router as adminDocsRouter };