"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./game/app");
const socket_api_1 = require("./game/socket-api");
const labels_api_1 = require("./labels/labels-api");
const cors_1 = __importDefault(require("cors"));
app_1.app.use((0, cors_1.default)());
app_1.app.use(socket_api_1.socketApi);
app_1.app.use(labels_api_1.labelsApi);
app_1.app.get('/', (req, res) => {
    res.send({ test: "ok" });
});
app_1.server.listen(80);
