import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { MessageType } from 'src/common/enums/message-type';
import { IAuthor } from 'src/common/interfaces';
export class CreateMessageDto {
  @ApiProperty({ description: 'Message', required: true })
  @IsString()
  room: string;

  @ApiProperty({ description: 'Message', required: true })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'type',
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ description: '사용자' })
  @IsObject()
  @IsOptional()
  user: IAuthor;
}
