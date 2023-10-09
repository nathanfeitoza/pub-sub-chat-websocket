import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { WebsocketModule } from '../websocket/websocket.module';
import { BullModule } from '@nestjs/bull';
import { EventsModule } from '../events/events.module';
import { CONFIG } from 'src/config/env-config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: CONFIG.redisHost,
        port: CONFIG.redisPort,
      },
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore as any,
      url: CONFIG.redisUrl,
    }),
    WebsocketModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
