"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.socketApi = void 0;
const redisconnection_1 = require("./redisconnection");
const dataApi = __importStar(require("./data-api"));
const redis_adapter_1 = require("@socket.io/redis-adapter");
const express_1 = __importDefault(require("express"));
require("dotenv/config");
// const fetch = import('node-fetch');
const router = express_1.default.Router();
router.use(express_1.default.urlencoded({ extended: true }));
router.use(express_1.default.json());
// launch socket server
Promise.all([redisconnection_1.redisPubClient.connect(), redisconnection_1.redisSubClient.connect()]).then(() => {
    // connected
    redisconnection_1.io.adapter((0, redis_adapter_1.createAdapter)(redisconnection_1.redisPubClient, redisconnection_1.redisSubClient));
    redisconnection_1.io.listen(3000);
});
redisconnection_1.io.on('connection', (socket) => {
    /*
    Join Room
    */
    socket.on('joinRoom', ({ groupid, userid }) => __awaiter(void 0, void 0, void 0, function* () {
        // log
        // l1('joinRoom')
        // l2({ groupid, userid })
        // connect redis
        // get group or create
        const group = yield dataApi.getGroup(groupid);
        // make sure user is added to group
        if (userid) {
            yield dataApi.addToGroup({ groupid, userid });
        }
        // join socket room
        socket.join(groupid);
        socket.emit('goto', group.position);
    }));
    socket.on('getGroupData', ({ groupid }) => __awaiter(void 0, void 0, void 0, function* () {
        const group = yield dataApi.getGroup(groupid);
        redisconnection_1.io.to(groupid).emit('loadGroupData', group);
    }));
    socket.on('prev', ({ groupid }, cb) => __awaiter(void 0, void 0, void 0, function* () {
        // l1('prev')
        const group = yield dataApi.getGroup(groupid);
        group.position = group.position === 0 ? 0 : group.position - 1;
        yield dataApi.writeGroup(group);
        redisconnection_1.io.to(groupid).emit('goto', group.position);
        if (cb) {
            cb();
        }
    }));
    socket.on('next', ({ groupid, position }, cb) => __awaiter(void 0, void 0, void 0, function* () {
        // l1('next')
        const group = yield dataApi.getGroup(groupid);
        if (position !== undefined) {
            group.position = position;
        }
        else {
            group.position = group.position + 1 || 0;
        }
        yield dataApi.writeGroup(group);
        console.log('goto', group.position, groupid);
        redisconnection_1.io.to(groupid).emit('goto', group.position);
        if (cb) {
            cb();
        }
    }));
    socket.on('createUser', ({ userid, groupid, name }, cb) => __awaiter(void 0, void 0, void 0, function* () {
        // TODO: check first if name exists
        // if (nameExists) {
        //   io.emit('alert', 'Deze naam bestaat al in deze groep.')
        //   return false
        // }
        // monitor
        // l3('create user', { userid, groupid, name })
        // (get or) create user
        const user = yield dataApi.getUser({ userid, groupid, name });
        // add to group
        yield dataApi.addToGroup({ groupid, userid });
        // joinroom
        console.log('createUser join group:', groupid);
        socket.join(groupid);
        // update all
        redisconnection_1.io.to(groupid).emit('addUser', { userid, name });
        // send groupuserdata
        const groupUserData = yield dataApi.getGroupUserData(groupid);
        redisconnection_1.io.to(groupid).emit('groupUserData', groupUserData);
        // done
        if (cb) {
            cb();
        }
    }));
    socket.on('removeUser', ({ groupid, userid }, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const done = yield dataApi.removeUser({ groupid, userid }).catch(() => {
            callback(false);
        });
        const groupUserData = yield dataApi.getGroupUserData(groupid).catch(err => {
            console.warn('group does not exist.');
        });
        if (typeof groupUserData !== 'boolean' && groupUserData) {
            redisconnection_1.io.to(groupid).emit('groupUserData', groupUserData);
        }
        callback(true);
    }));
    socket.on('getAllUserData', ({ groupid }) => __awaiter(void 0, void 0, void 0, function* () {
        // sync userdata
        const groupUserData = yield dataApi.getGroupUserData(groupid);
        // send userdata to group
        // console.log('groupUserData', groupUserData)
        redisconnection_1.io.emit('groupUserData', groupUserData);
    }));
    /*
    Submit Answer
    */
    socket.on('setAnswer', ({ groupid, userid, chapter, k, answer, name }) => __awaiter(void 0, void 0, void 0, function* () {
        // update redit user-{userid}
        yield dataApi.writeAnswer({ groupid, userid, chapter, k, answer, name });
        // send to group
        redisconnection_1.io.to(groupid).emit('updateAnswer', { userid, chapter, k, answer });
    }));
    /*
    toggle finished state of chapter
    */
    socket.on('startChapter', ({ groupid, chapter }) => __awaiter(void 0, void 0, void 0, function* () {
        // write finished state
        yield dataApi.setStartChapter({ groupid, chapter });
        // update state to group
        redisconnection_1.io.to(groupid).emit('setStartChapter', { chapter, groupid });
    }));
    socket.on('unStartChapter', ({ groupid, chapter }) => __awaiter(void 0, void 0, void 0, function* () {
        // write finished state
        yield dataApi.setUnStartChapter({ groupid, chapter });
        // update state to group
        redisconnection_1.io.to(groupid).emit('setUnStartChapter', { chapter, groupid });
    }));
    socket.on('finish', ({ groupid, chapter }) => __awaiter(void 0, void 0, void 0, function* () {
        // write finished state
        yield dataApi.setFinished({ groupid, chapter });
        // update state to group
        redisconnection_1.io.to(groupid).emit('setFinished', { chapter, groupid });
    }));
    socket.on('unFinish', ({ groupid, chapter }) => __awaiter(void 0, void 0, void 0, function* () {
        // write finished state
        yield dataApi.setUnFinished({ groupid, chapter });
        // update state to group
        redisconnection_1.io.to(groupid).emit('setUnFinished', { chapter, groupid });
    }));
    socket.on('setDone', ({ groupid, userid, chapter }) => __awaiter(void 0, void 0, void 0, function* () {
        yield dataApi.setDone({ groupid, userid, chapter });
        redisconnection_1.io.to(groupid).emit('setDone', { userid, chapter, groupid });
    }));
    socket.on('setUnDone', ({ groupid, userid, chapter }) => __awaiter(void 0, void 0, void 0, function* () {
        yield dataApi.setUnDone({ groupid, userid, chapter });
        redisconnection_1.io.to(groupid).emit('setDone', { userid, chapter, groupid });
    }));
});
router.get('/testbot', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var startTime = performance.now();
    const data = yield fetch('http://bot:5000/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: 'user-123', 'groupid': 'group-123', 'comment': 'Vind dit weer echt vreselijk. Van mij hoeft het niet warmer dan 20 graden te worden. Maar ben bang dat dit helemaal de verkeerde kant op gaat. De winters zijn we al vergeten. Dat bestaat al niet meer. Dit is gewoon een natuur ramp!' })
    }).then(data => data.json()).catch(err => {
        console.warn('--- error --- ');
        console.warn(err);
        res.send({ error: err });
    });
    if (data) {
        var endTime = performance.now();
        var time = endTime - startTime;
        res.send({ data, time });
    }
}));
router.get('/groupinfo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // groups
    const groupKeys = yield redisconnection_1.redisPubClient.keys("group-*");
    const groups = [];
    for (let i in groupKeys) {
        groups.push(JSON.parse(yield redisconnection_1.redisPubClient.get(groupKeys[i])));
    }
    // users
    const userKeys = yield redisconnection_1.redisPubClient.keys("user-*");
    const users = [];
    for (let i in userKeys) {
        users.push(JSON.parse(yield redisconnection_1.redisPubClient.get(userKeys[i])));
    }
    // send
    res.send({ groups, users });
}));
router.post('/beatthebot', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || !req.body.text) {
        res.send('No input.');
        return false;
    }
    const URL = process.env.BOTAPI;
    let headers = {};
    if (process.env.BOTAPIKEY) {
        headers = { 'Authorization': 'Bearer ' + process.env.BOTAPIKEY };
    }
    fetch(URL, { headers, method: "POST", body: req.body.text })
        .then(response => response.json())
        .then(data => {
        let score = -1;
        if (data[0] && data[0][0] && data[0][0]['label'] === 'LABEL_1') {
            score = data[0][0]['score'];
        }
        else {
            score = data[0][1]['score'];
        }
        res.send({ score: score });
    });
}));
const socketApi = router;
exports.socketApi = socketApi;
