import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreateRoomDto {
  @ApiProperty({ description: 'max 인원', required: true })
  @Type(() => Number)
  @IsNumber()
  max: number;

  @ApiProperty({ description: '신고여부', default: false })
  @IsBoolean()
  @IsOptional()
  isFlagged: boolean;

  @ApiProperty({ description: '신고여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPaid: boolean;

  @ApiProperty({ description: '제목', required: false })
  @IsString()
  @IsOptional()
  note: string;

  @ApiProperty({ description: 'appointment' })
  @Type(() => Date)
  @IsDate()
  appointedAt: Date;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '모임 아이디' })
  @IsNumber()
  @IsOptional()
  meetupId: number | null;
}
