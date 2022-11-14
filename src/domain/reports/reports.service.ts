import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IncomingWebhook } from '@slack/webhook';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { InjectSlack } from 'nestjs-slack-webhook';
import { ReportTarget } from 'src/common/enums/report-status';
import { CreateReportDto } from 'src/domain/reports/dto/create-report.dto';
import { UpdateReportDto } from 'src/domain/reports/dto/update-report.dto';
import { Report } from 'src/domain/reports/report.entity';
import { User } from 'src/domain/users/user.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class ReportsService {
  constructor(
    @InjectSlack() private readonly slack: IncomingWebhook,
    @InjectRepository(Report)
    private readonly repository: Repository<Report>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateReportDto): Promise<Report> {
    const report = this.repository.create(dto);
    const target = dto.target === ReportTarget.USER ? '사용자' : '아티클댓글';
    this.slack.send(
      `[local-test] 신고가 접수되었습니다.\n- 대상: ${target}\n- 이유:${dto.reason}`,
    );

    return await this.repository.save(report);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // 공지사항 리스트 (관리자)
  async findAll(query: PaginateQuery): Promise<Paginated<Report>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'reportStatus'],
      searchableColumns: ['reason'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        reportStatus: [FilterOperator.EQ],
      },
      relations: ['user'],
    });
  }

  // 공지사항 상세보기
  async findById(id: number, relations: string[] = []): Promise<Report> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateReportDto): Promise<Report> {
    const reports = await this.repository.preload({ id, ...dto });
    if (!reports) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(reports);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Report> {
    const reports = await this.findById(id);
    return await this.repository.remove(reports);
  }
}
