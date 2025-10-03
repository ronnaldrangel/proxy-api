"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = adminAuth;
const config_1 = require("../config");
/**
 * Middleware para autenticar solicitudes admin usando el header X-Master-Key
 */
function adminAuth(req, res, next) {
    const masterKey = req.header('X-Master-Key');
    if (!masterKey) {
        return res.status(401).json({ error: 'Master key no proporcionada' });
    }
    if (masterKey !== config_1.config.MASTER_API_KEY) {
        return res.status(403).json({ error: 'Master key inválida' });
    }
    next();
}
