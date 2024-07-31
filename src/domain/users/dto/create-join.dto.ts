import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateJoinDto {
  @ApiProperty({ description: '신청인 message', required: false })
  @IsString()
  @IsOptional()
  message: string;

  @ApiProperty({ description: '신청인 skill level', required: false })
  @IsNumber()
  @IsOptional()
  skill: number;
}
