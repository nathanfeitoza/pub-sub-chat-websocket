import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';

@Catch(BadRequestException)
export class WsValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient();

    const response = {
      status: 'error',
      message: 'Input validation failed',
      errors: exception.getResponse()['message'],
    };

    client.emit('exception', response);
  }
}
