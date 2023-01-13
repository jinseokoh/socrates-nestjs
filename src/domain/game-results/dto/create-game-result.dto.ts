import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateGameResultDto {
  @ApiProperty({ description: '제목', default: null })
  @IsString()
  @IsOptional()
  question: string | null;

  @ApiProperty({ description: '답변', default: null })
  @IsString()
  @IsOptional()
  answer: string | null;

  @ApiProperty({ description: 'user score', default: 0 })
  @IsNumber()
  userScore?: number;

  @ApiProperty({ description: 'other score', default: 0 })
  @IsNumber()
  otherScore?: number;

  @ApiProperty({ description: 'gameId' })
  @IsNumber()
  gameId?: number;

  @ApiProperty({ description: 'userId' })
  @IsNumber()
  @IsOptional()
  userId?: number | null;

  @ApiProperty({ description: 'otherId' })
  @IsNumber()
  @IsOptional()
  otherId?: number | null;
}
