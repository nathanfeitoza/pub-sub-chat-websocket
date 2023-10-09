import { Processor, Process, OnQueueActive, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { WsGateway } from '../../websocket/gateway/websocket.gateway';
import { CONFIG } from 'src/config/env-config';
import { Logger } from '@nestjs/common';

@Processor('events')
export class EventsConsumer {
  private logger = new Logger(EventsConsumer.name);

  constructor(private readonly wsGateway: WsGateway) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(
        job.data,
      )}`,
    );
  }

  @OnQueueFailed()
  onError(job: Job) {
    this.logger.error('Job failed', { job });
  }

  @Process(CONFIG.queueProcess)
  async handleTransmit(job: Job) {
    this.logger.log('Init', { job });
    const userId = job.data.userId;
    const message = job.data;

    await this.wsGateway.sendMessageToUser(userId, message);

    this.logger.log('Finished');
  }
}
