import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateJoinDto {
  @ApiProperty({ description: 'meetupId' })
  @IsNumber()
  @IsOptional()
  meetupId: number;

  @ApiProperty({ description: 'userId' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'recipientId' })
  @IsNumber()
  recipientId: number;

  @ApiProperty({ description: 'message' })
  @IsString()
  message: string;

  @ApiProperty({ description: '신청인 skill level', required: false })
  @IsNumber()
  @IsOptional()
  skill: number;
}
