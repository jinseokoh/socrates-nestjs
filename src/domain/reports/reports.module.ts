import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackModule } from 'nestjs-slack-webhook';
import { ReportsController } from 'src/domain/reports/reports.controller';
import { ReportsService } from 'src/domain/reports/reports.service';
import { User } from 'src/domain/users/user.entity';
import { Report } from './report.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Report, User]), SlackModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
