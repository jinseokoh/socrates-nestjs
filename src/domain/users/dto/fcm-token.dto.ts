import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class FcmTokenDto {
  @ApiProperty({ description: 'title', default: 'Meet Socrates' })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ description: 'body' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'image url', default: null })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;
}
