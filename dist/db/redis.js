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
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const config_1 = require("../config");
// Crear cliente Redis
const redisClient = (0, redis_1.createClient)({
    url: config_1.config.REDIS_URL,
});
exports.redisClient = redisClient;
// Manejar eventos de conexión
redisClient.on('connect', () => {
    console.log('Conexión a Redis establecida');
});
redisClient.on('error', (err) => {
    console.error('Error de conexión a Redis:', err);
});
// Conectar a Redis
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.connect();
    }
    catch (error) {
        console.error('Error al conectar a Redis:', error);
    }
}))();
