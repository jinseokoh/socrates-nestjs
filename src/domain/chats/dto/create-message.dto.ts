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
  @ApiProperty({ description: '모임 id', required: true })
  @IsNumber()
  roomId: number;

  @ApiProperty({ description: '사용자 id', required: true })
  @IsNumber()
  userId: number;

  // 빈칸으로 남겨두면 자동생성
  @ApiProperty({
    description: '메시지 id (msg_xxxxxx_userId)',
    required: false,
  })
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

  // 3 타입중 하나가 들어와야 하므로 옵션
  @ApiProperty({ description: 'TextMessage 용 payload', required: false })
  @IsString()
  @IsOptional()
  message: string | null;

  // 3 타입중 하나가 들어와야 하므로 옵션
  @ApiProperty({ description: 'ImageMessage 용 payload', required: false })
  @IsObject()
  @IsOptional()
  image: IImage | null;

  // 3 타입중 하나가 들어와야 하므로 옵션
  @ApiProperty({ description: 'CustomMessage 용 payload', required: false })
  @IsObject()
  @IsOptional()
  appointment: IAppointment | null;

  // 빈칸으로 남겨두면 자동생성
  @ApiProperty({
    description: 'ttl',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  expires: number;
}
