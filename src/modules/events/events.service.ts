import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CONFIG } from '../../config/env-config';
import { Logger } from '@nestjs/common';

export class EventsService {
  private logger = new Logger(EventsService.name);

  constructor(
    @InjectQueue(CONFIG.queueName) private readonly messageQueue: Queue,
  ) {}

  async sendMessage(userId: string, message: string): Promise<string> {
    this.logger.log('Init', { userId, message });
    const job = await this.messageQueue.add(CONFIG.queueProcess, {
      userId: userId,
      message,
    });

    this.logger.log('finished', { job });

    return 'ok';
  }
}
