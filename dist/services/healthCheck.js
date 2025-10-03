"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMasterApiHealth = checkMasterApiHealth;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
/**
 * Verifica la salud de la API maestra al iniciar el servidor
 * Hace un GET a https://edge.wazend.net/health con el header X-Api-Key
 */
function checkMasterApiHealth() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`${config_1.config.MASTER_API_BASE_URL}/health`, {
                headers: {
                    'X-Api-Key': config_1.config.MASTER_API_KEY
                },
                timeout: 5000 // 5 segundos de timeout
            });
            if (response.status >= 200 && response.status < 300) {
                console.log('API Maestra está en línea y funcionando correctamente');
                return true;
            }
            else {
                throw new Error(`API Maestra respondió con estado: ${response.status}`);
            }
        }
        catch (error) {
            console.error('Error al verificar la API maestra:', error);
            throw new Error('No se pudo verificar la salud de la API maestra');
        }
    });
}
