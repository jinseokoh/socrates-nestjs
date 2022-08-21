import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';

// note that we are currently using redis@3
// ref) https://stackoverflow.com/questions/71120056/what-is-the-correct-way-to-use-socket-io-with-redis-adapter-on-nest-js
export class RedisIoAdapter extends IoAdapter {
  protected redisAdapter;

  constructor(app: INestApplication) {
    super(app);
    const pubClient = createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
    const subClient = pubClient.duplicate();

    // pubClient.connect();
    // subClient.connect();

    this.redisAdapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as Server;

    server.adapter(this.redisAdapter);

    return server;
  }
}
