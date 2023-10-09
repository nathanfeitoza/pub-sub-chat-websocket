import { Body, Controller, Post } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('/send-message')
  async sendMessage(@Body() data: any): Promise<string> {
    return this.eventsService.sendMessage(data.userId, data.message);
  }
}
