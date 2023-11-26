import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { MessageType } from 'src/common/enums';
import {
  IAppointment,
  IImage,
} from 'src/domain/chats/entities/message.interface';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message', required: true })
  @IsNumber()
  meetupId: number;

  @ApiProperty({ description: '사용자 id', required: true })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'msg_createdAt_userId', required: true })
  @IsString()
  @IsOptional()
  id: string;

  @ApiProperty({
    description: 'type',
    default: MessageType.TEXT,
    required: true,
  })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiProperty({ description: 'TextMessage 용 payload', required: false })
  @IsString()
  @IsOptional()
  message: string | null;

  @ApiProperty({ description: 'ImageMessage 용 payload', required: false })
  @IsObject()
  @IsOptional()
  image: IImage | null;

  @ApiProperty({ description: 'CustomMessage 용 payload', required: false })
  @IsObject()
  @IsOptional()
  appointment: IAppointment | null;

  @ApiProperty({ description: 'ttl', required: false })
  @IsNumber()
  @IsOptional()
  expires: number;

  @ApiProperty({ description: 'createdAt', required: true })
  @IsNumber()
  // @IsOptional()
  createdAt: number;

  @ApiProperty({ description: 'updatedAt' })
  @IsNumber()
  @IsOptional()
  updatedAt: number;
}
