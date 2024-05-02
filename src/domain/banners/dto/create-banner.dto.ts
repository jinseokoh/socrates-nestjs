import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ description: 'banner title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'image asset' })
  @IsString()
  @IsOptional()
  asset: string | null;

  @ApiProperty({ description: 'image network' })
  @IsString()
  @IsOptional()
  image: string | null;

  @ApiProperty({ description: '본문', required: false })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '공개여부' })
  @IsBoolean()
  isActive: boolean;
}
