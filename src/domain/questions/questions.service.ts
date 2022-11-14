import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateQuestionDto } from 'src/domain/questions/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/domain/questions/dto/update-question.dto';
import { Question } from 'src/domain/questions/question.entity';
import { Repository } from 'typeorm';
@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly repository: Repository<Question>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateQuestionDto): Promise<Question> {
    const question = this.repository.create(dto);
    return await this.repository.save(question);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Question>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: ['question'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        question: [FilterOperator.EQ],
      },
      relations: ['user', 'artwork'], // can be removed.
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Question> {
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

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
      },
    });
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.repository.preload({ id, ...dto });
    if (!question) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(question);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Question> {
    const question = await this.findById(id);
    return await this.repository.softRemove(question);
  }

  async remove(id: number): Promise<Question> {
    const question = await this.findById(id);
    return await this.repository.remove(question);
  }
}
