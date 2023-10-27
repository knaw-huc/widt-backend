import { Server } from 'socket.io'
// import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from 'redis';
import type {ClientToServerEvents, ServerToClientEvents} from '../types/types.d'

export const redisPubClient = createClient({ url: 'redis://widt-redis:6379' });
export const redisSubClient = redisPubClient.duplicate();

redisPubClient.on("error", function (err) {
  console.log("Redis Error:", err);
});

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(2224, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})