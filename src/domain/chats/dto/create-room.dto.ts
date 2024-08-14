import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { RoomStatus } from 'src/common/enums';
export class CreateRoomDto {
  @ApiProperty({ description: 'slug prefix', required: true })
  @IsString()
  prefix: string;

  @ApiProperty({ description: 'cost', default: 0 })
  @IsNumber()
  cost: number;

  @ApiProperty({ description: '참여자 userIds', default: false })
  @IsArray()
  ids: number[];

  @ApiProperty({
    description: 'room status',
    default: RoomStatus.PENDING,
  })
  @IsEnum(RoomStatus)
  @IsOptional()
  roomStatus: RoomStatus;

  @ApiProperty({ description: 'flag count', default: false })
  @IsNumber()
  @IsOptional()
  flagCount: number;

  @ApiProperty({ description: 'last read message id', required: false })
  @IsString()
  @IsOptional()
  lastMessageId: string | null;

  @ApiProperty({ description: 'last message', required: false })
  @IsString()
  @IsOptional()
  lastMessage: string | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
