import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateDestinationDto {
  @ApiProperty({ description: '주소지 제목', required: false })
  @IsString()
  @IsOptional()
  title?: string | null;

  @ApiProperty({ description: '수취인 이름', required: false })
  @IsString()
  @IsOptional()
  name?: string | null;

  @ApiProperty({ description: '수취인 전화번호', required: false })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({ description: '우편번호' })
  @IsString()
  @IsOptional()
  postalCode?: string | null;

  @ApiProperty({ description: '주소' })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiProperty({ description: '상세주소' })
  @IsString()
  @IsOptional()
  addressDetail?: string | null;

  @ApiProperty({ description: '시/군/구', required: false })
  @IsString()
  @IsOptional()
  city?: string | null;

  @ApiProperty({ description: '특별시/광역시/구', required: false })
  @IsString()
  @IsOptional()
  state?: string | null;

  @ApiProperty({ description: '국가명', required: false })
  @IsString()
  @IsOptional()
  country?: string | null;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number | null;
}
