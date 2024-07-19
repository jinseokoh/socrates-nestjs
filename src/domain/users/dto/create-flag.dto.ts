import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateFlagDto {
  @ApiProperty({ description: 'message 정보', required: true })
  @IsString()
  message: string;

  @ApiProperty({ description: 'entity 정보', required: true })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'entity 아이디', required: true })
  @IsNumber()
  entityId: number;

  @ApiProperty({ description: 'user 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
