import { redisPubClient } from "./redisconnection";
import { Sequelize, DataTypes } from "sequelize";
import connection from "./connection";
import type { USER, GROUP, USERTABLE, GROUPTABLE } from "../types/types";

const sequelize = new Sequelize(
  connection.database,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: connection.host,
    // port: connection.port,
    dialect: "mariadb",
  }
);

const GROUPS = sequelize.define<GROUPTABLE>("groups", {
  groupid: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  version: { type: DataTypes.STRING},
  position: { type: DataTypes.STRING },
  started: { type: DataTypes.JSON },
  users: { type: DataTypes.JSON },
  finished: { type: DataTypes.JSON },
  showResults: { type: DataTypes.JSON },
});

const USERS = sequelize.define<USERTABLE>("users", {
  userid: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  groupid: { type: DataTypes.JSON },
  name: { type: DataTypes.STRING },
  answers: { type: DataTypes.JSON },
  done: { type: DataTypes.JSON },
});

const COMMENTS = sequelize.define("comments", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT },
  groupid: { type: DataTypes.STRING },
  userid: { type: DataTypes.JSON },
  score: { type: DataTypes.STRING },
  duration: { type: DataTypes.STRING },
});

USERS.sync().catch((err) => {
  console.warn('---\nCannot create table "users".\n---');
  console.warn(err);
});

GROUPS.sync().catch((err) => {
  console.warn('---\nCannot create table "groups".\n---');
  console.warn(err);
});

COMMENTS.sync().catch((err) => {
  console.warn('---\nCannot create table "comments".\n---');
  console.warn(err);
});

sequelize.getQueryInterface().addColumn('groups', 'version', {
  type: DataTypes.TEXT,
}).then(x => {
  console.log('column added')
}).catch(x => {
  console.log('column exists probably')
})


export async function getUser({
  userid,
  groupid,
  name,
}: {
  userid: string;
  groupid: string;
  name?: string;
}) {
  /*
  get or create
  */
  let user = false;
  // get redis user
  const redisUser = await redisPubClient.get(`user-${userid}`);
  // if not, get sqlgroup
  if (!redisUser) {
    // get sqlgroup
    // user = await sql.getUser(id)

    // set redisgroup
    if (user) {
      // fill with group data
      await writeUser(user, "redis");
    }
  } else {
    user = JSON.parse(redisUser);
  }
  // return group if found
  if (typeof user === "object") {
    return user;
  }
  // create user if no redis && no mysql:
  const emptyUser: USER = {
    userid,
    groupid,
    name,
    answers: {},
    done: [],
  };
  await writeUser(emptyUser);
  return emptyUser;
}

export async function removeUser({
  groupid,
  userid,
}: {
  groupid: string;
  userid: string;
}) {
  // remove from group
  const group = await getGroup(groupid);
  if (!group) {
    throw Error("Group does not exist.");
  }
  group.users = group.users.filter((x) => {
    return x !== userid;
  });

  if (group) {
    await writeGroup(group);
  }
}

export async function getGroup(groupid: string) {
  /*
  get or create
  */
  let group = false;
  // get redis group
  const redisGroup = await redisPubClient.get(`group-${groupid}`);
  // if not, get sqlgroup
  if (!redisGroup) {
    // get sqlgroup
    // group = await sql.get(id)

    // set redisgroup
    if (group) {
      // fill with group data
      await writeGroup(group, "redis");
    }
  } else {
    group = JSON.parse(redisGroup);
  }
  // return group if found
  if (typeof group === "object") {
    return group;
  }

  // create group if no redis && no mysql:
  const emptyGroup: GROUP = {
    version: '',
    groupid,
    position: 0,
    started: [],
    users: [],
    finished: [],
    showResults: [],
  };
  await writeGroup(emptyGroup);
  return emptyGroup;
}

export async function storeVersion({ groupid, version }: { groupid: string, version: string }) {
  // only to sql
  const ret = await GROUPS.upsert({groupid, version}).catch((err) => {
    console.log("--- storeVersion sql error ---");
  });
}

export async function getGroupUserData(groupid: string) {
  const data: Array<USER> = [];
  const group = await getGroup(groupid);
  if (!group) {
    throw Error("Group does not exist.");
  }

  for (let i in group.users) {
    const userid = group.users[i];
    const userdata = await getUser({ groupid, userid });
    if (typeof userdata === "object") {
      data.push(userdata);
    }
  }
  return data;
}

export async function addToGroup({
  groupid,
  userid,
}: {
  groupid: string;
  userid: string;
}) {
  const group = await getGroup(groupid);

  if (!group) {
    throw Error(`Group does not exist. (groupid: ${groupid}, addToGroup)`);
  }

  if (!group.users.includes(userid)) {
    group.users.push(userid);
  }
  // l1('add to group')
  // l3(group)
  await writeGroup(group);

  return true;
}

export async function writeUser(user: USER, service?: string) {
  if (!user.userid) {
    console.log("--- writeUser: missing userid ---", new Date().toString());
    return false;
  }
  // redis
  if (!service || service === "redis") {
    await redisPubClient.set(`user-${user.userid}`, JSON.stringify(user));
  }
  // sql
  if (!service || service === "sql") {
    await USERS.upsert(user).catch((err) => {
      console.log("--- writeUser sql error ---");
      console.log(err);
    });
  }
}

export async function writeGroup(group: GROUP, service?: string) {
  if (!group.groupid) {
    console.log("--- missing group id ---", new Date().toString());
    return false;
  }

  // redis
  if (!service || service === "redis") {
    // l4('write group redis', group)
    await redisPubClient
      .set(`group-${group.groupid}`, JSON.stringify(group))
      .catch();
  }
  // sql
  if (!service || service === "sql") {
    const ret = await GROUPS.upsert(group).catch((err) => {
      console.log(err);
      console.log("--- writeGroup sql error ---", new Date().toString());
    });
  }
  // console.log('write group', group)
}

export async function writeAnswer(
  {
    groupid,
    userid,
    chapter,
    k,
    answer,
    name,
  }: {
    groupid: string;
    userid: string;
    chapter: string;
    k: number;
    answer: any;
    name: string;
  },
  service?: string
) {
  // redis
  const user = await getUser({ userid, groupid, name });
  if (!user) {
    throw Error(`Can't find user ${userid} to write answer ${k}, ${answer}`);
  }
  if (!(chapter in user.answers)) {
    user.answers[chapter] = [];
  }
  user.answers[chapter][k] = answer;

  await writeUser(user);
}

export async function setFinished({
  groupid,
  chapter,
}: {
  groupid: string;
  chapter: string;
}) {
  const group = await getGroup(groupid);
  if (!group.finished) {
    group.finished = [];
  }
  if (!group.finished.includes(chapter)) {
    group.finished.push(chapter);
  }
  await writeGroup(group);
}
export async function setUnFinished({
  groupid,
  chapter,
}: {
  groupid: string;
  chapter: string;
}) {
  const group = await getGroup(groupid);
  if (!group.finished) {
    group.finished = [];
  }
  if (group.finished.includes(chapter)) {
    group.finished.splice(group.finished.indexOf(chapter), 1);
  }
  await writeGroup(group);
}

export async function setShowResults({
  groupid,
  chapter,
}: {
  groupid: string;
  chapter: string;
}) {
  const group = await getGroup(groupid);
  if (!group.showResults) {
    group.showResults = [];
  }
  if (!group.showResults.includes(chapter)) {
    group.showResults.push(chapter);
  }
  await writeGroup(group);
}
export async function setUnShowResults({
  groupid,
  chapter,
}: {
  groupid: string;
  chapter: string;
}) {
  const group = await getGroup(groupid);
  if (!group.showResults) {
    group.showResults = [];
  }
  if (group.showResults.includes(chapter)) {
    group.showResults.splice(group.showResults.indexOf(chapter), 1);
  }
  await writeGroup(group);
}

export async function setStartChapter({
  groupid,
  chapter,
}: {
  groupid: string;
  chapter: string;
}) {
  const group = await getGroup(groupid);
  if (typeof group !== "object") {
    throw Error(
      `Group does not exist. Can not start chapter ${groupid}, ${chapter}`
    );
  }
  if (!group.started) {
    group.started = [];
  }
  if (!group.started.includes(chapter)) {
    group.started.push(chapter);
  }
  await writeGroup(group);
}
export async function setUnStartChapter({
  groupid,
  chapter,
}: {
  groupid: string;
  chapter: string;
}) {
  const group = await getGroup(groupid);
  if (typeof group !== "object") {
    throw Error(
      `Group does not exist. Can not unstart chapter ${groupid}, ${chapter}`
    );
  }
  if (!group.started) {
    group.started = [];
  }
  if (group.started.includes(chapter)) {
    group.started.splice(group.started.indexOf(chapter), 1);
  }
  await writeGroup(group);
}

export async function setDone({
  groupid,
  userid,
  chapter,
}: {
  groupid: string;
  userid: string;
  chapter: string;
}) {
  const user = await getUser({ groupid, userid });
  if (!user.done) {
    user.done = [];
  }
  if (!user.done.includes(chapter)) {
    user.done.push(chapter);
  }
  await writeUser(user);
}
export async function setUnDone({
  groupid,
  userid,
  chapter,
}: {
  groupid: string;
  userid: string;
  chapter: string;
}) {
  const user = await getUser({ groupid, userid });
  if (!user.done) {
    user.done = [];
  }
  if (user.done.includes(chapter)) {
    user.done.splice(user.done.indexOf(chapter), 1);
  }
  await writeUser(user);
}

export async function writeComment({
  text,
  groupid,
  userid,
  id,
  duration,
}: {
  text: string;
  groupid?: string;
  userid?: string;
  score?: string | number;
  id?: number;
  duration?: string | number;
}) {
  const commentObject: {
    text: string;
    groupid?: string;
    userid?: string;
    score?: string | number;
    id?: number;
    duration?: string | number;
  } = { text };
  if (groupid) {
    commentObject.groupid = groupid;
  }
  if (userid) {
    commentObject.userid = userid;
  }
  if (duration) {
    commentObject.duration = duration;
  }
  if (id) {
    commentObject.id = id;
  }
  const ret = await COMMENTS.upsert(commentObject, { returning: ["*"] });
  // console.log('============')
  // console.log(ret)
  // console.log('============')
  return commentObject;
}

export async function backup() {
  const _models = [{ GROUPS }, { USERS }, { COMMENTS }];
  const exportData = [];
  for (let m in _models) {
    let tmpData = await Object.values(_models[m])[0].findAll({
      paranoid: false,
    });
    if (tmpData) {
      tmpData = JSON.parse(JSON.stringify(tmpData));
    }
    let tmpobj = {
      name: Object.keys(_models[m])[0],
      data: tmpData || [],
    };
    //
    //
    exportData.push(tmpobj);
  }

  return exportData

  // // place the file in the dir
  // const pad = `./backup/backup.json`;
  // return fs.writeFileSync(pad, JSON.stringify(exportData));
}
