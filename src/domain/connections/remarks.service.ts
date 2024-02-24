import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateRemarkDto } from 'src/domain/connections/dto/create-remark.dto';

import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Remark } from 'src/domain/connections/entities/remark.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateRemarkDto } from 'src/domain/connections/dto/update-remark.dto';
import { FcmService } from 'src/services/fcm/fcm.service';

@Injectable()
export class RemarksService {
  private readonly logger = new Logger(RemarksService.name);

  constructor(
    @InjectRepository(Remark)
    private readonly repository: Repository<Remark>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    // @Inject(SlackService) private readonly slack: SlackService,
    private readonly fcmService: FcmService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateRemarkDto): Promise<Remark> {
    // creation
    const remark = await this.repository.save(this.repository.create(dto));
    const remarkWithUser = await this.findById(remark.id, [
      'user',
      'connection',
      'connection.user',
    ]);
    console.log('remarkWithUser', remarkWithUser);
    // emit SSE
    this.redisClient.emit('sse.add_connection', remarkWithUser);
    //? 푸시노티 push notification
    // const fbToken = threadWithUser.meetup.user.pushToken;
    // const notification = {
    //   title: 'MeSo',
    //   body: '모임에 댓글이 달렸습니다.',
    // };
    // this.fcmService.sendToToken(fbToken, notification);

    this.connectionRepository.increment(
      { id: dto.connectionId },
      `remarkCount`,
      1,
    );

    return remarkWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Remark>> {
    const queryBuilder = this.repository
      .createQueryBuilder('remark')
      .innerJoinAndSelect('remark.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('remark.children', 'children')
      .leftJoinAndSelect('children.user', 'replier')
      .where('remark.parentId IS NULL')
      .andWhere('remark.deletedAt IS NULL');

    const config: PaginateConfig<Remark> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        connectionId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Remark>(query, queryBuilder, config);
  }

  async findAllById(
    connectionId: number,
    remarkId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    const queryBuilder = this.repository
      .createQueryBuilder('remark')
      .innerJoinAndSelect('remark.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('remark.connectionId = :connectionId', { connectionId })
      .andWhere('remark.parentId = :remarkId', { remarkId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('remark.id = :remarkId', { remarkId }).orWhere(
      //       'remark.parentId = :remarkId',
      //       { remarkId },
      //     );
      //   }),
      // )
      .andWhere('remark.deletedAt IS NULL');

    const config: PaginateConfig<Remark> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<Remark>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Remark> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Remark | null> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateRemarkDto): Promise<Remark> {
    const remark = await this.repository.preload({ id, ...dto });
    if (!remark) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(remark);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Remark> {
    try {
      const remark = await this.findById(id);
      await this.repository.softRemove(remark);
      await this.connectionRepository.manager.query(
        `UPDATE connection SET remarkCount = remarkCount - 1 WHERE id = ? AND remarkCount > 0`,
        [remark.connectionId],
      );
      return remark;
    } catch (e) {
      this.logger.log(e);
    }
  }

  async remove(id: number): Promise<Remark> {
    const remark = await this.findById(id);
    return await this.repository.remove(remark);
  }
}
