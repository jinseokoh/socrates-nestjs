import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuctionStatus } from 'src/common/enums';
export class CreateAuctionDto {
  @ApiProperty({ description: '제목 🔍' })
  @IsString()
  title: string;

  @ApiProperty({ description: '부제목 🔍' })
  @IsString()
  subtitle: string;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images: string[] | null;

  @ApiProperty({
    description: '경매시작 년도주차 (ex. 202259; 자동생성)',
    required: false,
  })
  @IsString()
  @IsOptional()
  weeks: string;

  @ApiProperty({ description: '경매시작시각 💡 (ISO8601)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: '경매종료시각 (ISO8601)' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: '경매최종종료시각 (ISO8601)', required: false })
  @IsString()
  @IsOptional()
  closingTime?: string | null;

  @ApiProperty({ description: '연장시간 (분)' })
  @IsNumber()
  @IsOptional()
  bidExtMins?: number | null;

  @ApiProperty({ description: '경매추정가' })
  @IsNumber()
  @IsOptional()
  estimate?: number | null;

  @ApiProperty({ description: '경매시작가' })
  @IsNumber()
  @IsOptional()
  startingPrice?: number | null;

  @ApiProperty({ description: '경매최소보장가', required: false })
  @IsNumber()
  @IsOptional()
  reservePrice?: number | null;

  @ApiProperty({ description: '호가증감액' })
  @IsNumber()
  @IsOptional()
  bidIncrement?: number | null;

  @ApiProperty({ description: '배달비', required: false })
  @IsNumber()
  @IsOptional()
  deliveryFee?: number | null;

  @ApiProperty({ description: '입찰횟수', required: false })
  @IsNumber()
  @IsOptional()
  bidCount?: number | null;

  @ApiProperty({ description: '마지막입찰액', required: false })
  @IsNumber()
  @IsOptional()
  lastBidAmount?: number | null;

  @ApiProperty({ description: '마지막입찰자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  lastBidderId?: number | null;

  @ApiProperty({
    description: '히스토리 리스트에서 가격표시여부 💡',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiProperty({ description: '경매상태 💡', default: AuctionStatus.PREPARING })
  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus | null;

  @ApiProperty({ description: '미공개 메모', required: false })
  @IsString()
  @IsOptional()
  note?: string | null;

  @ApiProperty({ description: '결제시각 (ISO8601)', required: false })
  @Type(() => Date)
  @IsOptional()
  paidAt?: string | null;

  @ApiProperty({ description: '작품 아이디' })
  @IsNumber()
  artworkId: number;
}
