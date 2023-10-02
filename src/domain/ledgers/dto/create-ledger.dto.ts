import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Ledger as LedgerType } from 'src/common/enums';
import { Day } from 'src/common/enums/day';
import { Expense } from 'src/common/enums/expense';
import { Gender } from 'src/common/enums/gender';
import { Time } from 'src/common/enums/time';
import { CreateVenueDto } from 'src/domain/venues/dto/create-venue.dto';
export class CreateLedgerDto {
  @ApiProperty({ description: '기술/레벨', required: true })
  @Type(() => Number)
  @IsNumber()
  debit: number;

  @ApiProperty({ description: '기술/레벨', required: true })
  @Type(() => Number)
  @IsNumber()
  credit: number;

  @ApiProperty({ description: '기술/레벨', required: true })
  @Type(() => Number)
  @IsNumber()
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
