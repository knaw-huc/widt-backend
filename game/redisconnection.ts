import { Server } from 'socket.io'
// import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from 'redis';

export const redisPubClient = createClient({ url: 'redis://widt-redis:6379' });
export const redisSubClient = redisPubClient.duplicate();

redisPubClient.on("error", function (err) {
  console.log("Redis Error:", err);
});

export const io = new Server(2224, {cors: {
  origin: "*",
  methods: ["GET", "POST"]
}})