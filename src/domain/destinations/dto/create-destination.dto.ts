import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateDestinationDto {
  @ApiProperty({ description: '주소지 제목', required: false })
  @IsString()
  @IsOptional()
  title?: string | null;

  @ApiProperty({ description: '수취인 이름' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ description: '수취인 전화번호' })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({ description: '수취인 전화번호', required: false })
  @IsString()
  @IsOptional()
  phone2?: string | null;

  @ApiProperty({ description: '우편번호' })
  @IsString()
  @IsOptional()
  postalCode: string;

  @ApiProperty({ description: '주소' })
  @IsString()
  @IsOptional()
  address: string;

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

  @ApiProperty({ description: '배송시 요청사항', required: false })
  @IsString()
  @IsOptional()
  requestMessage?: string | null;

  @ApiProperty({ description: 'default 여부', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean | null;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number | null;
}
