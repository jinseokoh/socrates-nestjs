import { PartialType } from '@nestjs/swagger';
import { CreateReportDto } from 'src/domain/reports/dto/create-report.dto';

export class UpdateReportDto extends PartialType(CreateReportDto) {}
