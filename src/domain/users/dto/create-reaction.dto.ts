import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Emotion } from 'src/common/enums/emotion';
export class CreateReactionDto {
  @ApiProperty({ description: 'emotion', default: Emotion.SYMPATHETIC })
  @IsEnum(Emotion)
  emotion: Emotion;

  @ApiProperty({ description: '평가대상 사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '평가하는 사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  connectionId: number | null;
}
