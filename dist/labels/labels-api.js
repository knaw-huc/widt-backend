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
exports.labelsApi = void 0;
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const connection_1 = __importDefault(require("./connection"));
const child_process_1 = require("child_process");
const router = express_1.default.Router();
const port = 4445;
router.use(express_1.default.urlencoded({ extended: true }));
router.use(express_1.default.json());
// const { DataTypes } = Sequelize;
const sequelize = new sequelize_1.Sequelize(connection_1.default.database, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: connection_1.default.host,
    // port: connection.port,
    dialect: 'mariadb'
});
const LABEL = sequelize.define('labels', {
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userid: { type: sequelize_1.DataTypes.STRING },
    reactie: { type: sequelize_1.DataTypes.TEXT },
    labels: { type: sequelize_1.DataTypes.JSON },
    customlabels: { type: sequelize_1.DataTypes.JSON }
});
LABEL.sync().catch(err => {
    console.warn('---\nCannot create table "labels".\n---');
});
router.all('/labels/pull', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const command = "git pull";
    var child = (0, child_process_1.exec)(command, { cwd: "./../" });
    const alldata = [];
    child.stdout.on('data', function (data) {
        alldata.push(data);
    });
    child.stderr.on('data', function (data) {
        alldata.push('stderr: ' + data);
    });
    child.on('close', function (code) {
        res.send({ alldata });
    });
}));
router.all('/labels/*', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.header({
        "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": '*',
        "Access-Control-Expose-Headers": '*'
    });
    next();
}));
// put
router.put('/labels/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // insert into database
    const result = yield LABEL.create(req.body).catch(err => {
        res.status(500).send(err.message);
    });
    if (result) {
        res.send(result);
    }
}));
// check
router.all('/labels/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.send({ 'ok': 'thank you.' });
}));
router.all('/labels/results', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const all = yield LABEL.findAll();
    res.send(all);
}));
const labelsApi = router;
exports.labelsApi = labelsApi;
