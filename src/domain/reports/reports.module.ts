import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from 'src/domain/reports/reports.controller';
import { ReportsService } from 'src/domain/reports/reports.service';
import { User } from 'src/domain/users/user.entity';
import { Report } from './report.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Report, User])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
