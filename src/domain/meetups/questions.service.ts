import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { SignedUrl } from 'src/common/types';
import { CreateQuestionDto } from 'src/domain/meetups/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/domain/meetups/dto/update-question.dto';
import { Question } from 'src/domain/meetups/entities/question.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly repository: Repository<Question>,
    private readonly s3Service: S3Service,
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
    const queryBuilder = this.repository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.answers', 'answer')
      .leftJoinAndSelect('answer.user', 'userAnswered')
      .leftJoinAndSelect('question.meetup', 'meetup')
      .leftJoinAndSelect('question.user', 'userQuestioned');

    const config: PaginateConfig<Question> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        meetupId: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // reserved. no use cases as of yet.
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

  // reserved. no use cases as of yet.
  async count(body: string): Promise<number> {
    return await this.repository.countBy({
      body: body,
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

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('question', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }
}
