import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { RedisIoAdapter } from './modules/websocket/adapter/redis-io-adapter';
import { CONFIG } from './config/env-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(CONFIG.validationPipeInstance);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(CONFIG.serverPort);

  console.log('API Server started on port', CONFIG.serverPort);
  console.log('Wesocket started on port', CONFIG.wsPort);
}
bootstrap();
