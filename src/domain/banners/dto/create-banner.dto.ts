import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ButtonType } from 'src/common/enums';
export class CreateBannerDto {
  @ApiProperty({ description: 'banner title' })
  @IsString()
  title: string;

  @ApiProperty({ description: '본문', required: false })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: 'banner image Url' })
  @IsString()
  @IsOptional()
  image: string | null;

  @ApiProperty({ description: 'button label' })
  @IsString()
  buttonLabel: string;

  @ApiProperty({
    description: 'button type',
    default: ButtonType.INFO,
  })
  @IsEnum(ButtonType)
  buttonType: ButtonType;

  @ApiProperty({ description: '공개여부' })
  @IsBoolean()
  isActive: boolean;
}
