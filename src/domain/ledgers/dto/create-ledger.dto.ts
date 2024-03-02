import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LedgerType } from 'src/common/enums';
export class CreateLedgerDto {
  @ApiProperty({ description: '증가', required: true })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  debit: number;

  @ApiProperty({ description: '감소', required: true })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  credit: number;

  @ApiProperty({ description: '잔고', required: true })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  balance: number;

  @ApiProperty({ description: 'ledger type', default: LedgerType.CREDIT_SPEND })
  @IsEnum(LedgerType)
  @IsOptional()
  ledgerType: LedgerType;

  @ApiProperty({ description: '비고', default: null })
  @IsString()
  @IsOptional()
  note: string | null;

  @ApiProperty({ description: '생성시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  createdAt?: Date | null;

  @ApiProperty({ description: '수정시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  updatedAt?: Date | null;

  @ApiProperty({ description: 'User 아이디' })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
