import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from 'src/common/enums';
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

  @ApiProperty({ description: 'Message', required: true })
  @IsString()
  message: string;

  @ApiProperty({ description: 'createdAt', required: true })
  @IsNumber()
  // @IsOptional()
  createdAt: number;

  @ApiProperty({ description: 'updatedAt' })
  @IsNumber()
  @IsOptional()
  updatedAt: number;
}
