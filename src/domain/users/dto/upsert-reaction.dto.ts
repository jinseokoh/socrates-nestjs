import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpsertReactionDto {
  @ApiProperty({ description: '평가대상 사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: '평가하는 사용자 아이디' })
  @IsNumber()
  @IsOptional()
  connectionId: number;

  @ApiProperty({ description: 'sympathy' })
  @IsBoolean()
  sympathy: boolean;

  @ApiProperty({ description: 'smile' })
  @IsBoolean()
  smile: boolean;

  @ApiProperty({ description: 'surprise' })
  @IsBoolean()
  surprise: boolean;

  @ApiProperty({ description: 'sorry' })
  @IsBoolean()
  sorry: boolean;

  @ApiProperty({ description: 'uneasy' })
  @IsBoolean()
  uneasy: boolean;

  @ApiProperty({ description: 'isNewReaction' })
  @IsBoolean()
  isNewReaction: boolean;
}
