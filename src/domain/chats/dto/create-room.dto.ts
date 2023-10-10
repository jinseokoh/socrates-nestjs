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
  @ApiProperty({ description: 'last read message id', required: true })
  @IsString()
  @IsOptional()
  lastReadMessageId: string | null;

  @ApiProperty({
    description: 'party type',
    default: PartyType.GUEST,
  })
  @IsEnum(PartyType)
  partyType: PartyType;

  @ApiProperty({ description: '신고여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPaid: boolean;

  @ApiProperty({ description: '신고여부', default: false })
  @IsBoolean()
  @IsOptional()
  isExcluded: boolean;

  @ApiProperty({ description: '제목', required: false })
  @IsString()
  @IsOptional()
  note: string;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '모임 아이디' })
  @IsNumber()
  @IsOptional()
  meetupId: number | null;
}
