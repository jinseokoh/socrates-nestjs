import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateRemarkDto } from 'src/domain/feeds/dto/create-remark.dto';

import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Remark } from 'src/domain/feeds/entities/remark.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateRemarkDto } from 'src/domain/feeds/dto/update-remark.dto';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RemarksService {
  private readonly logger = new Logger(RemarksService.name);

  constructor(
    @InjectRepository(Remark)
    private readonly repository: Repository<Remark>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    // @Inject(SlackService) private readonly slack: SlackService,
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateRemarkDto): Promise<Remark> {
    // creation
    const remark = await this.repository.save(this.repository.create(dto));

    // fetch data for notification recipient
    const remarkWithUser = await this.findById(remark.id, [
      'user',
      'feed',
      'feed.user',
      'feed.user.profile',
    ]);
    // notification with event listener ------------------------------------//
    const event = new UserNotificationEvent();
    event.name = 'feedRemark';
    event.userId = remarkWithUser.feed.user.id;
    event.token = remarkWithUser.feed.user.pushToken;
    event.options = remarkWithUser.feed.user.profile?.options ?? {};
    event.body = `내 발견글에 누군가 댓글을 남겼습니다.`;
    event.data = {
      page: `feeds/${dto.feedId}`,
      args: '',
    };
    this.eventEmitter.emit('user.notified', event);

    this.feedRepository.increment(
      { id: dto.feedId },
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
        feedId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Remark>(query, queryBuilder, config);
  }

  async findAllById(
    feedId: number,
    remarkId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    const queryBuilder = this.repository
      .createQueryBuilder('remark')
      .innerJoinAndSelect('remark.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('remark.feedId = :feedId', { feedId })
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
      await this.feedRepository.manager.query(
        `UPDATE feed SET remarkCount = remarkCount - 1 WHERE id = ? AND remarkCount > 0`,
        [remark.feedId],
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
