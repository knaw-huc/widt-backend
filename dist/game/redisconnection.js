"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.redisSubClient = exports.redisPubClient = void 0;
const app_1 = require("./app");
const socket_io_1 = require("socket.io");
// import { createAdapter } from "@socket.io/redis-adapter";
const redis_1 = require("redis");
exports.redisPubClient = (0, redis_1.createClient)({ url: 'redis://widt-redis:6379' });
exports.redisSubClient = exports.redisPubClient.duplicate();
exports.redisPubClient.on("error", function (err) {
    console.log("Redis Error:", err);
});
exports.io = new socket_io_1.Server(app_1.server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
