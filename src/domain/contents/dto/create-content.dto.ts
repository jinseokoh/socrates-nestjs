import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentType } from 'src/common/enums';
export class CreateContentDto {
  @ApiProperty({ description: '제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '본문', required: false })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '이미지', required: false })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiProperty({
    description: '분류',
    default: ContentType.ANNOUNCEMENTS,
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ description: '공개여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
