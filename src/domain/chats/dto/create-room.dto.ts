import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartyType } from 'src/common/enums';
export class CreateRoomDto {
  @ApiProperty({
    description: 'party type',
    default: PartyType.GUEST,
  })
  @IsEnum(PartyType)
  partyType: PartyType;

  @ApiProperty({ description: 'paid 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPaid: boolean;

  @ApiProperty({ description: 'ended 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isEnded: boolean;

  @ApiProperty({ description: 'banned 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isBanned: boolean;

  @ApiProperty({ description: '제목', required: false })
  @IsString()
  @IsOptional()
  lastMessage: string | null;

  @ApiProperty({ description: 'last read message id', required: true })
  @IsString()
  @IsOptional()
  lastMessageId: string | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '모임 아이디' })
  @IsNumber()
  @IsOptional()
  meetupId: number | null;
}
