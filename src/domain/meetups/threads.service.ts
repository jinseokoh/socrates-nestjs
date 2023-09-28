import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { SignedUrl } from 'src/common/types';
import { CreateThreadDto } from 'src/domain/meetups/dto/create-thread.dto';
import { UpdateThreadDto } from 'src/domain/meetups/dto/update-thread.dto';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
@Injectable()
export class ThreadsService {
  constructor(
    @InjectRepository(Thread)
    private readonly repository: Repository<Thread>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateThreadDto): Promise<Thread> {
    // creation
    const thread = await this.repository.save(this.repository.create(dto));
    // fetch thread w/ user to emit SSE
    const threadWithUser = await this.findById(thread.id, ['user']);
    console.log('threadWithUser', threadWithUser);
    // emit SSE
    this.redisClient.emit('sse.threads', {
      key: 'sse.create',
      value: threadWithUser,
    });

    // notify slack
    return threadWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // 댓글 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<Thread>> {
    const queryBuilder = this.repository
      .createQueryBuilder('thread')
      .innerJoinAndSelect('thread.user', 'user')
      .leftJoinAndSelect('thread.children', 'children')
      .leftJoinAndSelect('children.user', 'childrenUser')
      .where('thread.parentId IS NULL')
      // .andWhere('children.isFlagged = :isFlagged', { isFlagged: false }); // makes all flagged thread disappear
      .andWhere('thread.deletedAt IS NULL');

    const config: PaginateConfig<Thread> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        meetupId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 답글 리스트
  async findAllById(
    meetupId: number,
    threadId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Thread>> {
    const queryBuilder = this.repository
      .createQueryBuilder('thread')
      .innerJoinAndSelect('thread.user', 'user')
      .where('thread.meetupId = :meetupId', { meetupId })
      .andWhere('thread.parentId = :threadId', { threadId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('thread.id = :threadId', { threadId }).orWhere(
      //       'thread.parentId = :threadId',
      //       { threadId },
      //     );
      //   }),
      // )
      .andWhere('thread.deletedAt IS NULL');

    const config: PaginateConfig<Thread> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Thread>(query, queryBuilder, config);
  }

  // required when checking if the thread exists
  async findById(id: number, relations: string[] = []): Promise<Thread> {
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

  async update(id: number, dto: UpdateThreadDto): Promise<Thread> {
    const thread = await this.repository.preload({ id, ...dto });
    // user validation here might be a good option to be added
    if (!thread) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(thread);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Thread> {
    const thread = await this.findById(id);
    // user validation here might be a good option to be added
    return await this.repository.softRemove(thread);
  }

  async remove(id: number): Promise<Thread> {
    const thread = await this.findById(id);
    // user validation here might be a good option to be added
    return await this.repository.remove(thread);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('thread', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }
}
