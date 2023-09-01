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
exports.setUnStartChapter = exports.setStartChapter = exports.setUnFinished = exports.setFinished = exports.writeAnswer = exports.writeGroup = exports.writeUser = exports.addToGroup = exports.getGroupUserData = exports.getGroup = exports.removeUser = exports.getUser = void 0;
const redisconnection_1 = require("./redisconnection");
function getUser({ userid, groupid, name }) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        get or create
        */
        let user = false;
        // get redis user
        const redisUser = yield redisconnection_1.redisPubClient.get(`user-${userid}`);
        // if not, get sqlgroup
        if (!redisUser) {
            // get sqlgroup
            // user = await sql.getUser(id)
            // set redisgroup
            if (user) {
                // fill with group data
                yield writeUser(user, 'redis');
            }
        }
        else {
            user = JSON.parse(redisUser);
        }
        // return group if found
        if (user !== false) {
            return user;
        }
        // create user if no redis && no mysql: 
        const emptyUser = {
            userid,
            groupid,
            name,
            answers: {}
        };
        yield writeUser(emptyUser);
        return emptyUser;
    });
}
exports.getUser = getUser;
function removeUser({ groupid, userid }) {
    return __awaiter(this, void 0, void 0, function* () {
        // remove from group
        const group = yield getGroup(groupid);
        if (!group) {
            return false;
        }
        group.users = group.users.filter(x => {
            return x !== userid;
        });
        if (group) {
            yield writeGroup(group);
        }
    });
}
exports.removeUser = removeUser;
function getGroup(groupid) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        get or create
        */
        let group = false;
        // get redis group
        const redisGroup = yield redisconnection_1.redisPubClient.get(`group-${groupid}`);
        // if not, get sqlgroup
        if (!redisGroup) {
            // get sqlgroup
            // group = await sql.get(id)
            // set redisgroup
            if (group) {
                // fill with group data
                yield writeGroup(group, 'redis');
            }
        }
        else {
            group = JSON.parse(redisGroup);
        }
        // return group if found
        if (typeof group === 'object') {
            return group;
        }
        // create group if no redis && no mysql: 
        const emptyGroup = {
            groupid,
            position: 0,
            started: [],
            users: []
        };
        yield writeGroup(emptyGroup);
        return emptyGroup;
    });
}
exports.getGroup = getGroup;
function getGroupUserData(groupid) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = [];
        const group = yield getGroup(groupid);
        if (!group) {
            return false;
        }
        // l1('group data:')
        for (let i in group.users) {
            const userid = group.users[i];
            const userdata = yield getUser({ groupid, userid });
            if (userdata) {
                data.push(userdata);
            }
        }
        return data;
    });
}
exports.getGroupUserData = getGroupUserData;
function addToGroup({ groupid, userid }) {
    return __awaiter(this, void 0, void 0, function* () {
        const group = yield getGroup(groupid);
        if (!group) {
            throw Error(`Group does not exist. (groupid: ${groupid}, addToGroup)`);
        }
        if (!group.users.includes(userid)) {
            group.users.push(userid);
        }
        // l1('add to group')
        // l3(group)
        yield writeGroup(group);
        return true;
    });
}
exports.addToGroup = addToGroup;
function writeUser(user, service) {
    return __awaiter(this, void 0, void 0, function* () {
        // redis
        if (!service || service === 'redis') {
            yield redisconnection_1.redisPubClient.set(`user-${user.userid}`, JSON.stringify(user));
        }
        // sql
        if (!service || service === 'sql') {
            // await sql.create(emptyGroup)
        }
    });
}
exports.writeUser = writeUser;
function writeGroup(group, service) {
    return __awaiter(this, void 0, void 0, function* () {
        // redis
        if (!service || service === 'redis') {
            // l4('write group redis', group)
            yield redisconnection_1.redisPubClient.set(`group-${group.groupid}`, JSON.stringify(group));
        }
        // sql
        if (!service || service === 'sql') {
            // await sql.create(emptyGroup)
        }
        console.log('write group', group);
    });
}
exports.writeGroup = writeGroup;
function writeAnswer({ groupid, userid, chapter, k, answer, name }, service) {
    return __awaiter(this, void 0, void 0, function* () {
        // redis
        if (!service || service === 'redis') {
            const user = yield getUser({ userid, groupid, name });
            if (!user || user === true) {
                throw Error(`Can't find user ${userid} to write answer ${k}, ${answer}`);
            }
            if (!(chapter in user.answers)) {
                user.answers[chapter] = [];
            }
            user.answers[chapter][k] = answer;
            // console.log(JSON.stringify(user))
            yield redisconnection_1.redisPubClient.set(`user-${user.userid}`, JSON.stringify(user));
        }
    });
}
exports.writeAnswer = writeAnswer;
function setFinished({ groupid, userid, name }) {
    return __awaiter(this, void 0, void 0, function* () {
        // const group = await getGroup(groupid)
        // if (!group.finished) { group.finished = {} }
        // if (!group.finished[name]) { group.finished[name] = [] }
        // if (group.finished && !group.finished[name].includes(userid)) { group.finished[name].push(userid) }
        // await writeGroup(group)
    });
}
exports.setFinished = setFinished;
function setUnFinished({ groupid, userid, name }) {
    return __awaiter(this, void 0, void 0, function* () {
        // const group = await getGroup(groupid)
        // if (!group.finished) { group.finished = {} }
        // if (!group.finished[name]) { group.finished[name] = [] }
        // if (group.finished && group.finished[name].includes(userid)) { group.finished[name].splice(group.finished[name].indexOf(userid), 1) }
        // await writeGroup(group)
    });
}
exports.setUnFinished = setUnFinished;
function setStartChapter({ groupid, name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const group = yield getGroup(groupid);
        if (typeof group !== 'object') {
            throw Error(`Group does not exist. Can not unstart chapter ${groupid}, ${name}`);
        }
        if (!group.started) {
            group.started = [];
        }
        if (!group.started.includes(name)) {
            group.started.push(name);
        }
        yield writeGroup(group);
    });
}
exports.setStartChapter = setStartChapter;
function setUnStartChapter({ groupid, name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const group = yield getGroup(groupid);
        if (typeof group !== 'object') {
            throw Error(`Group does not exist. Can not unstart chapter ${groupid}, ${name}`);
        }
        if (!group.started) {
            group.started = [];
        }
        if (group.started.includes(name)) {
            group.started.splice(group.started.indexOf(name), 1);
        }
        yield writeGroup(group);
    });
}
exports.setUnStartChapter = setUnStartChapter;
