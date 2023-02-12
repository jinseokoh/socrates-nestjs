import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class CreateBookmarkDto {
  @ApiProperty({ description: '신청' })
  @IsBoolean()
  @IsOptional()
  isAsked: boolean;

  @ApiProperty({ description: '매칭' })
  @IsBoolean()
  @IsOptional()
  isMatched: boolean;

  @ApiProperty({ description: 'User 아이디' })
  @IsString()
  @IsOptional()
  userId: string | null;

  @ApiProperty({ description: 'Meetup 아이디' })
  @IsString()
  @IsOptional()
  meetupId: string | null;

  @ApiProperty({ description: '미공개 메모', required: false })
  @IsString()
  @IsOptional()
  note?: string | null;
}
