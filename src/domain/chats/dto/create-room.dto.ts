import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartyType, RoomStatus } from 'src/common/enums';
export class CreateRoomDto {
  @ApiProperty({ description: '제목', required: false })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({
    description: 'room status',
    default: PartyType.GUEST,
  })
  @IsEnum(PartyType)
  roomStatus: RoomStatus;

  @ApiProperty({ description: '참여자 수', default: false })
  @IsNumber()
  @IsOptional()
  participantCount: number;

  @ApiProperty({ description: 'flag count', default: false })
  @IsNumber()
  @IsOptional()
  flagCount: number;

  @ApiProperty({ description: 'last read message id', required: true })
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
