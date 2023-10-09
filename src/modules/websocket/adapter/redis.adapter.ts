import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import { CONFIG } from 'src/config/env-config';

@Injectable()
export class RedisClientAdapter {
  private readonly redisClient: ReturnType<typeof createClient>;

  constructor() {
    this.redisClient = createClient({ url: CONFIG.redisUrl, legacyMode: true });
  }

  connect() {
    return this.redisClient.connect();
  }

  duplicate() {
    return this.redisClient.duplicate();
  }

  getRedisClient() {
    return this.redisClient;
  }
}
