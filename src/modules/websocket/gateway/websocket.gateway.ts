import { InjectQueue } from '@nestjs/bull';
import { Logger, UseFilters } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Queue } from 'bull';
import { Server, Socket } from 'socket.io';
import { CONFIG } from '../../../config/env-config';
import { ClientManagerAdapter } from '../adapter/client-manager.adapter';
import { MessageToUserInput } from '../dto/message-to-user.dto';
import {
  EntreyOrLeaveRoomInput,
  MessageToRoomInput,
} from '../dto/message-to-room.dto';
import { WsValidationExceptionFilter } from '../filters/ws-validation-exception.filter';

@WebSocketGateway(CONFIG.wsPort, { namespace: '/ws' })
@UseFilters(new WsValidationExceptionFilter())
export class WsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WsGateway.name);
  private userId: string;

  constructor(
    @InjectQueue(CONFIG.queueName) private readonly messageQueue: Queue,
    private readonly clientManagerAdapter: ClientManagerAdapter,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Initialized');
  }

  async handleConnection(client: Socket) {
    const authenticated = this.authenticate(client);

    if (authenticated) {
      await this.clientManagerAdapter.addUser(this.userId);
      client.join(this.userId);
      this.logger.log('Connected', { userId: this.userId });
      return;
    }

    this.logger.error('Client not logged');
    client.disconnect();
  }

  handleDisconnect() {
    if (this.userId) {
      this.clientManagerAdapter.disconnectUser(this.userId);
      this.logger.log('Disconnected', { userId: this.userId });
      return;
    }

    this.logger.log('Disconnected without userId');
  }

  private authenticate(client: Socket): boolean {
    const { userId = null } = client.handshake.query;

    if (userId) {
      this.userId = String(userId);
    }

    return userId !== null;
  }

  @SubscribeMessage('events')
  handleMessage(client: Socket, payload: any): string {
    this.logger.log('Message received', { payload });

    this.server.emit('message-to-server', {
      text: 'Hello from Server!',
    });

    client.emit('message-to-client', {
      text: 'Hello, client',
    });

    return 'Message received!';
  }

  @SubscribeMessage('messageToUser')
  handleMessageToUser(
    client: Socket,
    @MessageBody(CONFIG.validationPipeInstance) payload: MessageToUserInput,
  ) {
    this.logger.log('Message to user', { payload });

    this.sendMessageToUser(payload.userId, payload.message);
    this.logger.log('Send message');
  }

  private async checkUserIsMember(roomId: string, userId: string) {
    const userIsMember =
      await this.clientManagerAdapter.checkUserIsMemberOfRoom(roomId, userId);

    if (!userIsMember) {
      this.logger.warn('User not member of room', {
        roomId,
        userId,
      });
      throw Error('user_not_member');
    }

    return true;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(CONFIG.validationPipeInstance) payload: EntreyOrLeaveRoomInput,
  ) {
    const roomId = this.getRoomName(payload.roomId);
    const userIsMember =
      await this.clientManagerAdapter.checkUserIsMemberOfRoom(
        roomId,
        this.userId,
      );

    if (!userIsMember) {
      this.logger.log('Init entry room', { roomId });
      client.join(roomId);

      await this.clientManagerAdapter.addToRoom(roomId, this.userId);

      client.emit('joinedRoom', roomId);

      this.logMembersOnlineInRoom(roomId);
      this.logger.log('Finished entry room', { roomId });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody(CONFIG.validationPipeInstance)
    payload: EntreyOrLeaveRoomInput,
  ) {
    const roomId = this.getRoomName(payload.roomId);
    this.logger.log('Init leave', { roomId });

    try {
      await this.checkUserIsMember(roomId, this.userId);

      client.leave(roomId);

      await this.clientManagerAdapter.leaveRoom(roomId, this.userId);

      client.emit('leftRoom', roomId);
      this.logMembersOnlineInRoom(roomId);
      this.logger.log('Finished leave');
    } catch (error) {
      console.log(error);
    }
  }

  private logMembersOnlineInRoom(roomId: string) {
    this.clientManagerAdapter.getMembersOnlineInRoom(roomId).then((members) => {
      this.logger.log('Members online in room', { members: members.length });
    });
  }

  private getRoomName(roomId: string) {
    return `room:${roomId}`;
  }

  @SubscribeMessage('sendMessageToRoom')
  async sendMessageToRoom(
    client: Socket,
    @MessageBody(CONFIG.validationPipeInstance) payload: MessageToRoomInput,
  ) {
    this.logger.log('Init', { payload });
    const roomId = this.getRoomName(payload.roomId);

    try {
      await this.checkUserIsMember(roomId, this.userId);

      this.server.to(roomId).emit('messageFromRoom', {
        from: this.userId,
        message: payload.message,
      });

      this.logger.log('Message sent to room');
    } catch (error) {
      console.log(error);
    }
  }

  async sendMessageToUser(userId: string, message: any) {
    this.logger.log('Init', { userId, message });
    const userLogged = await this.clientManagerAdapter.getUser(userId);
    this.logger.log('Client', { userLogged });

    if (userLogged.client) {
      this.logger.log('Send message to client');
      this.server.to(userId).emit('userEvent', { message });
      return;
    }

    this.logger.warn('Client not found');
  }
}
