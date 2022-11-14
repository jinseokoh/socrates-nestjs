import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from 'src/common/enums/report-status';
import { ReportTarget } from './../../../common/enums/report-status';

export class CreateReportDto {
  @ApiProperty({
    description: '신고대상',
    default: ReportTarget.USER,
  })
  @IsEnum(ReportTarget)
  @IsOptional()
  target?: ReportTarget;

  @ApiProperty({ description: '신고대상 아이디', required: false })
  @IsNumber()
  targetId?: number | null;

  @ApiProperty({ description: '신고이유' })
  @IsString()
  reason: string;

  @ApiProperty({
    description: '처리상태',
    default: ReportStatus.PENDING,
  })
  @IsEnum(ReportStatus)
  @IsOptional()
  reportStatus?: ReportStatus;

  @ApiProperty({ description: '비고' })
  @IsString()
  @IsOptional()
  note?: string | null;

  @ApiProperty({ description: '신고자 아이디' })
  @IsNumber()
  userId: number | null;
}
