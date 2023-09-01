"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_api_1 = require("./game/socket-api");
const labels_api_1 = require("./labels/labels-api");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(socket_api_1.socketApi);
app.use(labels_api_1.labelsApi);
app.get('/', (req, res) => {
    res.send({ test: "ok" });
});
app.listen(80);
