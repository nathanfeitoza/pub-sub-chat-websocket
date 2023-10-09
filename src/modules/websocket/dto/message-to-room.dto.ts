import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MessageToRoomInput {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class EntreyOrLeaveRoomInput {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}
