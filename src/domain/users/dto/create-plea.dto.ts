import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PleaStatus } from 'src/common/enums';
export class CreatePleaDto {
  @ApiProperty({ description: 'id' })
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty({ description: 'senderId' })
  @IsNumber()
  @IsOptional()
  senderId: number;

  @ApiProperty({ description: 'recipientId' })
  @IsNumber()
  @IsOptional()
  recipientId: number;

  @ApiProperty({ description: 'dotId' })
  @IsNumber()
  @IsOptional()
  dotId: number;

  @ApiProperty({ description: 'connectionId' })
  @IsNumber()
  @IsOptional()
  connectionId?: number | null;

  @ApiProperty({
    description: 'status',
    default: PleaStatus.INIT,
    required: true,
  })
  @IsEnum(PleaStatus)
  @IsOptional()
  status: PleaStatus;

  @ApiProperty({ description: '요청시 사례 비용' })
  @IsNumber()
  reward: number;

  @ApiProperty({ description: '요청시 보내는 글; optional' })
  @IsString()
  @IsOptional()
  message?: string;
}
