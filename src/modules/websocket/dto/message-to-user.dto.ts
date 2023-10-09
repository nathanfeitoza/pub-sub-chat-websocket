import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MessageToUserInput {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
