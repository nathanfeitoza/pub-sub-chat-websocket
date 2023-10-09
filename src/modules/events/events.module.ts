import { BullModule } from '@nestjs/bull';
import { EventsConsumer } from './consumer/events.consumer';
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { CONFIG } from 'src/config/env-config';

@Module({
  controllers: [EventsController],
  imports: [
    WebsocketModule,
    BullModule.registerQueue({
      name: CONFIG.queueName,
    }),
  ],
  providers: [EventsConsumer, EventsService],
})
export class EventsModule {}
