import { Module } from '@nestjs/common';
import { WsGateway } from './gateway/websocket.gateway';
import { BullModule } from '@nestjs/bull';
import { CONFIG } from '../../config/env-config';
import { ClientManagerAdapter } from './adapter/client-manager.adapter';
import { RedisClientAdapter } from './adapter/redis.adapter';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CONFIG.queueName,
    }),
  ],
  providers: [WsGateway, ClientManagerAdapter, RedisClientAdapter],
  exports: [WsGateway],
})
export class WebsocketModule {}
