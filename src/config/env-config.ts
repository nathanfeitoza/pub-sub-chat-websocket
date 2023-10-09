import { ValidationPipe } from '@nestjs/common';
import { config } from 'dotenv';

config();

export const CONFIG = {
  redisUrl: process.env.REDIS_URL || 'redis://redis',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  databaseUrl: process.env.DATABASE_URL || 'localhost',
  queueName: 'events',
  queueProcess: 'transmit',
  serverPort: 3000,
  wsPort: 3001,
  validationPipeInstance: new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
};
