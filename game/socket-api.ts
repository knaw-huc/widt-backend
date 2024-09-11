import { io, redisPubClient, redisSubClient } from "./redisconnection";
import * as dataApi from "./data-api";
import { createAdapter } from "@socket.io/redis-adapter";
import { l1, l2, l3, l4, log } from "./log";
import express from "express";
import "dotenv/config";
import cors from "cors";

// const fetch = import('node-fetch');

const router = express.Router();

router.use(
  cors({
    origin: [
      new RegExp(/http:\/\/localhost$/),
      "http:localhost",
      new RegExp(/\.wie-is-de-trol\.nl$/),
      new RegExp(/\.wie-is-de-trol\.nl\/beatthebot$/),
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// launch socket server

Promise.all([redisPubClient.connect(), redisSubClient.connect()]).then(() => {
  // connected
  io.adapter(createAdapter(redisPubClient, redisSubClient));
  io.listen(3000);
});

io.on("connection", (socket) => {
  /*
  Join Room
  */

  socket.on("joinRoom", async ({ groupid, userid }) => {
    // log
    // l1('joinRoom')
    // l2({ groupid, userid })
    // connect redis

    // get group or create
    const group = await dataApi.getGroup(groupid);

    // make sure user is added to group
    if (userid) {
      await dataApi.addToGroup({ groupid, userid });
    }

    // join socket room
    socket.join(groupid);

    socket.emit("goto", group.position);
  });

  socket.on("getGroupData", async ({ groupid }) => {
    const group = await dataApi.getGroup(groupid);

    io.to(groupid).emit("loadGroupData", group);
  });
  
  socket.on("prev", async ({ groupid }, cb) => {
    // l1('prev')

    const group = await dataApi.getGroup(groupid);

    group.position = group.position === 0 ? 0 : group.position - 1;

    await dataApi.writeGroup(group);

    io.to(groupid).emit("goto", group.position);

    if (cb) {
      cb();
    }
  });

  socket.on("next", async ({ groupid, position }, cb) => {
    // l1('next')

    const group = await dataApi.getGroup(groupid);
    if (position !== undefined) {
      group.position = position;
    } else {
      group.position = group.position + 1 || 0;
    }
    await dataApi.writeGroup(group);

    // console.log("goto", group.position, groupid);
    io.to(groupid).emit("goto", group.position);

    if (cb) {
      cb();
    }
  });

  socket.on("createUser", async ({ userid, groupid, name }, cb) => {
    // console.log('create User')
    // TODO: check first if name exists
    // if (nameExists) {
    //   io.emit('alert', 'Deze naam bestaat al in deze groep.')
    //   return false
    // }
    // monitor
    // l3('create user', { userid, groupid, name })
    // (get or) create user
    const user = await dataApi.getUser({ userid, groupid, name });
    // add to group
    await dataApi.addToGroup({ groupid, userid });
    // joinroom
    // console.log("createUser, join group:", groupid);
    socket.join(groupid);
    // update all
    io.to(groupid).emit("addUser", { userid, groupid, name });
    // send groupuserdata
    const groupUserData = await dataApi.getGroupUserData(groupid);
    io.to(groupid).emit("groupUserData", groupUserData);
    // done
    if (cb) {
      cb(true);
    }
  });

  socket.on("getUserData", async ({ userid, groupid, name }, callback) => {
    const user = await dataApi.getUser({ userid, groupid, name });
    // io.emit('setUserData', user)
    callback(user);
  });

  socket.on("removeUser", async ({ groupid, userid }, callback) => {
    const done = await dataApi.removeUser({ groupid, userid }).catch(() => {
      callback(false);
    });

    const groupUserData = await dataApi
      .getGroupUserData(groupid)
      .catch((err) => {
        console.warn("group does not exist.");
      });

    if (typeof groupUserData !== "boolean" && groupUserData) {
      io.to(groupid).emit("groupUserData", groupUserData);
    }

    callback(true);
  });

  socket.on("getAllUserData", async ({ groupid }) => {
    // sync userdata
    const groupUserData = await dataApi.getGroupUserData(groupid);
    // send userdata to group
    // console.log('groupUserData', groupUserData)
    io.to(groupid).emit("groupUserData", groupUserData);
  });
  
  socket.on("storeVersion", async ({ groupid, version }: {groupid:string, version: string}) => {
    await dataApi.storeVersion({groupid, version})
  });

  /*
  Submit Answer
  */

  socket.on(
    "setAnswer",
    async ({ groupid, userid, chapter, k, answer, name }) => {
      // update redit user-{userid}
      await dataApi.writeAnswer({ groupid, userid, chapter, k, answer, name });

      // send to group
      io.to(groupid).emit("updateAnswer", { userid, chapter, k, answer });
    }
  );

  /*
  toggle finished state of chapter
  */

  socket.on("startChapter", async ({ groupid, chapter }) => {
    // write finished state
    await dataApi.setStartChapter({ groupid, chapter });
    // update state to group
    io.to(groupid).emit("setStartChapter", { chapter, groupid });
  });
  socket.on("unStartChapter", async ({ groupid, chapter }) => {
    // write finished state
    await dataApi.setUnStartChapter({ groupid, chapter });
    // update state to group
    io.to(groupid).emit("setUnStartChapter", { chapter, groupid });
  });
  socket.on("finish", async ({ groupid, chapter }) => {
    // write finished state
    await dataApi.setFinished({ groupid, chapter });
    // update state to group
    io.to(groupid).emit("setFinished", { chapter, groupid });
  });
  socket.on("unFinish", async ({ groupid, chapter }) => {
    // write finished state
    await dataApi.setUnFinished({ groupid, chapter });
    // update state to group
    io.to(groupid).emit("setUnFinished", { chapter, groupid });
  });
  socket.on("setShowResults", async ({ groupid, chapter }) => {
    // write finished state
    await dataApi.setShowResults({ groupid, chapter });
    // update state to group
    io.to(groupid).emit("setShowResults", { chapter, groupid });
  });
  socket.on("setUnShowResults", async ({ groupid, chapter }) => {
    // write finished state
    await dataApi.setUnShowResults({ groupid, chapter });
    // update state to group
    io.to(groupid).emit("setUnShowResults", { chapter, groupid });
  });
  socket.on("setDone", async ({ groupid, userid, chapter }) => {
    await dataApi.setDone({ groupid, userid, chapter });
    io.to(groupid).emit("setDone", { userid, chapter, groupid });
  });
  socket.on("setUnDone", async ({ groupid, userid, chapter }) => {
    await dataApi.setUnDone({ groupid, userid, chapter });
    io.to(groupid).emit("setDone", { userid, chapter, groupid });
  });
});

router.get("/testbot", async (req, res) => {
  var startTime = performance.now();
  const data = await fetch("http://bot:5000/", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      userid: "user-123",
      groupid: "group-123",
      comment:
        "Vind dit weer echt vreselijk. Van mij hoeft het niet warmer dan 20 graden te worden. Maar ben bang dat dit helemaal de verkeerde kant op gaat. De winters zijn we al vergeten. Dat bestaat al niet meer. Dit is gewoon een natuur ramp!",
    }),
  })
    .then((data) => data.json())
    .catch((err) => {
      console.warn("--- error --- ");
      console.warn(err);
      res.send({ error: err });
    });
  if (data) {
    var endTime = performance.now();
    var time = endTime - startTime;
    res.send({ data, time });
  }
});

// router.get('/groupinfo', async (req, res) => {
//   // groups
//   const groupKeys = await redisPubClient.keys("group-*")
//   const groups = []
//   for (let i in groupKeys) { groups.push(JSON.parse(await redisPubClient.get(groupKeys[i]))) }
//   // users
//   const userKeys = await redisPubClient.keys("user-*")
//   const users = []
//   for (let i in userKeys) { users.push(JSON.parse(await redisPubClient.get(userKeys[i]))) }
//   // send
//   res.send({groups, users})
// })

router.get("/backup", async (req, res) => {
  await dataApi.backup();
  res.send("done.");
});

router.get("/beatthebot", async (req, res) => {
  var startTime = performance.now();
  const data = await fetch("http://bot:5000/", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      userid: "user-123",
      groupid: "group-123",
      comment:
        "Kunnen we nu eindelijk aan de ijstijd beginnen? We hebben het nu al wel lang genoeg uitgesteld en het begint mij een beetje te heet onder de voeten te worden.",
    }),
  })
    .then((data) => data.json())
    .catch((err) => {
      console.warn(err);
      res.send({ error: err });
    });
  if (data) {
    var endTime = performance.now();
    var time = endTime - startTime;
    res.send({ score: data.value, time });
  }
});

router.post("/beatthebot", async (req, res) => {
  if (!req.body || !req.body.text) {
    res.send("No input.");
    return false;
  }

  const comment = await dataApi.writeComment({
    text: req.body.text,
    userid: req.body.userid || "none",
    groupid: req.body.groupid || "none",
  });

  var startTime = performance.now();
  const data = await fetch("http://bot:5000/", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      userid: req.body.userid || "none",
      groupid: req.body.groupid || "none",
      comment: req.body.text,
    }),
  })
    .then((data) => data.json())
    .catch((err) => {
      console.warn(err);
      res.send({ error: err });
    });
  if (data) {
    var endTime = performance.now();
    var time = endTime - startTime;
    const newcomment = JSON.parse(JSON.stringify(comment));
    newcomment.duration = time;
    newcomment.score = data.value;
    await dataApi.writeComment(newcomment);
    res.send({ score: data.value, time });
  }
});

router.post("/beatthebot_external", async (req, res) => {
  if (!req.body || !req.body.text) {
    res.send("No input.");
    return false;
  }

  const URL = process.env.BOTAPI;

  let headers = {};
  if (process.env.BOTAPIKEY) {
    headers = { Authorization: "Bearer " + process.env.BOTAPIKEY };
  }
  fetch(URL, { headers, method: "POST", body: req.body.text })
    .then((response) => response.json())
    .then((data) => {
      let score = -1;
      // if (data[0] && data[0][0] && data[0][0]['label'] === 'LABEL_1') {
      //   score = data[0][0]['score']
      // } else {
      //   score = data[0][1]['score']
      // }
      for (let i in data[0]) {
        if (data[0][i]["label"] === "LABEL_1") {
          score = data[0][i]["score"];
        }
      }
      res.send({ score: score });
    });
});

const socketApi = router;

export { socketApi };
