import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateSurveyDto } from 'src/domain/surveys/dto/create-survey.dto';
import { UpdateSurveyDto } from 'src/domain/surveys/dto/update-survey.dto';
import { Survey } from 'src/domain/surveys/entities/survey.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class SurveysService {
  private readonly logger = new Logger(SurveysService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly repository: Repository<Survey>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // Survey 생성
  async create(dto: CreateSurveyDto): Promise<Survey> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: dto.userId },
    });
    if (user.isBanned) {
      throw new BadRequestException(`not allowed to use`);
    }
    const Survey = this.repository.create(dto);
    return await this.repository.save(Survey);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Survey 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Survey>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        question: [FilterOperator.EQ],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
      relations: ['user'],
    });
  }

  // Survey 상세보기
  async findById(id: number, relations: string[] = []): Promise<Survey> {
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

  async update(id: number, dto: UpdateSurveyDto): Promise<Survey> {
    const survey = await this.repository.preload({ id, ...dto });
    if (!survey) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(survey);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Survey> {
    const Survey = await this.findById(id);
    return await this.repository.softRemove(Survey);
  }

  async remove(id: number): Promise<Survey> {
    const Survey = await this.findById(id);
    return await this.repository.remove(Survey);
  }
}
