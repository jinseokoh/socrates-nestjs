import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from 'src/domain/reports/report.entity';
import { ReportsController } from 'src/domain/reports/reports.controller';
import { ReportsService } from 'src/domain/reports/reports.service';
import { User } from 'src/domain/users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Report, User])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
