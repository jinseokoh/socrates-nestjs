import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateInquiryCommentDto } from 'src/domain/inquiries/dto/create-opinion.dto';

import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateInquiryCommentDto } from 'src/domain/inquiries/dto/update-opinion.dto';

@Injectable()
export class InquiryCommentsService {
  private readonly logger = new Logger(InquiryCommentsService.name);

  constructor(
    @InjectRepository(InquiryComment)
    private readonly repository: Repository<InquiryComment>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateInquiryCommentDto): Promise<InquiryComment> {
    // creation
    const opinion = await this.repository.save(this.repository.create(dto));
    const opinionWithUser = await this.findById(opinion.id, [
      'user',
      'inquiry',
      'inquiry.user',
    ]);
    console.log('opinionWithUser', opinionWithUser);

    this.inquiryRepository.increment({ id: dto.inquiryId }, `commentCount`, 1);

    return opinionWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<InquiryComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('opinion')
      .innerJoinAndSelect('opinion.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('opinion.children', 'children')
      .leftJoinAndSelect('children.user', 'replier')
      .where('opinion.parentId IS NULL')
      .andWhere('opinion.deletedAt IS NULL');

    const config: PaginateConfig<InquiryComment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        inquiryId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<InquiryComment>(query, queryBuilder, config);
  }

  async findAllById(
    inquiryId: number,
    opinionId: number,
    query: PaginateQuery,
  ): Promise<Paginated<InquiryComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('opinion')
      .innerJoinAndSelect('opinion.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('opinion.inquiryId = :inquiryId', { inquiryId })
      .andWhere('opinion.parentId = :opinionId', { opinionId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('opinion.id = :opinionId', { opinionId }).orWhere(
      //       'opinion.parentId = :opinionId',
      //       { opinionId },
      //     );
      //   }),
      // )
      .andWhere('opinion.deletedAt IS NULL');

    const config: PaginateConfig<InquiryComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<InquiryComment>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<InquiryComment> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<InquiryComment | null> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateInquiryCommentDto): Promise<InquiryComment> {
    const opinion = await this.repository.preload({ id, ...dto });
    if (!opinion) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(opinion);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<InquiryComment> {
    const opinion = await this.findById(id);
    await this.repository.softRemove(opinion);
    // no column named opinionCount. just remove it. that's all.
    // await this.inquiryRepository.manager.query(
    //   `UPDATE inquiry SET opinionCount = opinionCount - 1 WHERE id = ? AND opinionCount > 0`,
    //   [opinion.inquiryId],
    // );
    return opinion;
  }

  async remove(id: number): Promise<InquiryComment> {
    const opinion = await this.findById(id);
    return await this.repository.remove(opinion);
  }
}
