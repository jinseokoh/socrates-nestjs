import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnyData } from 'src/common/types';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { CreateFlagDto } from 'src/domain/flags/dto/create-flag.dto';
import { Flag } from 'src/domain/flags/entities/flag.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class FlagsService {
  private readonly env: any;
  private readonly logger = new Logger(FlagsService.name);

  constructor(
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? 생성
  //?-------------------------------------------------------------------------//

  // - 신고 리스트에 추가
  // - 가능하다면, 관련 entity flagCount 증가
  async createFlag(userId: number, dto: CreateFlagDto): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({ ...dto, userId }),
      );

      switch (dto.entityType) {
        case `feed`:
          await queryRunner.manager.query(
            'UPDATE `feed` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
        case `meetup`:
          await queryRunner.manager.query(
            'UPDATE `meetup` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
        case `comment`:
          await queryRunner.manager.query(
            'UPDATE `comment` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
        case `thread`:
          await queryRunner.manager.query(
            'UPDATE `thread` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
      }
      await queryRunner.commitTransaction();
      return flag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      if (error.code === 'ER_DUP_ENTRY') {
        // plea already exists
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // - 신고 리스트에서 삭제
  // - 가능하다면, 관련 entity flagCount 감소
  async deleteFlag(userId: number, dto: CreateFlagDto): Promise<AnyData> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, dto.entityType, dto.entityId],
      );
      if (affectedRows > 0) {
        switch (dto.entityType) {
          case `feed`:
            await queryRunner.manager.query(
              'UPDATE `feed` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
          case `meetup`:
            await queryRunner.manager.query(
              'UPDATE `meetup` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
          case `comment`:
            await queryRunner.manager.query(
              'UPDATE `comment` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
          case `thread`:
            await queryRunner.manager.query(
              'UPDATE `thread` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
        }
      }
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //?-------------------------------------------------------------------------//
  //? GET
  //?-------------------------------------------------------------------------//

  // 내가 신고한 entity 리스트 (paginated)
  async getFlagsByUserId(
    query: PaginateQuery,
    userId: number,
    entityType: string | null = null,
  ): Promise<Paginated<Flag>> {
    let queryBuilder;
    switch (entityType) {
      case `feed`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Feed,
            'feed',
            'feed.id = flag.entityId AND flag.entityType = :entityType',
            { entityType: 'feed' },
          )
          .where({
            userId: userId,
          });
        break;
      case `meetup`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Meetup,
            'meetup',
            'meetup.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .where({
            userId: userId,
          });
        break;
      case `comment`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Comment,
            'comment',
            'comment.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .where({
            userId: userId,
          });
        break;
      case `thread`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Thread,
            'thread',
            'thread.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .where({
            userId: userId,
          });
        break;
      case `user`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            User,
            'user',
            'user.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .where({
            userId: userId,
          });
        break;
      default:
        queryBuilder = this.flagRepository.createQueryBuilder('flag').where({
          userId: userId,
        });
        break;
    }

    const config: PaginateConfig<Flag> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // -------------------------------------------------------------------------//
  //  Feeds
  // -------------------------------------------------------------------------//

  // 내가 차단한 Feeds (paginated)
  async findFlaggedFeedsByUserId(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Feed>> {
    const queryBuilder = this.feedRepository
      .createQueryBuilder('feed')
      .innerJoin(Flag, 'flag', 'feed.id = flag.entityId')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', { entityType: 'feed' });
    const config: PaginateConfig<Feed> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // -------------------------------------------------------------------------//
  // Meetups
  // -------------------------------------------------------------------------//

  // 내가 차단한 Meetups
  async getFlaggedMeetupsByUserId(userId: number): Promise<any[]> {
    const queryBuilder = this.flagRepository.createQueryBuilder('flag');
    return queryBuilder
      .innerJoinAndSelect(
        Meetup,
        'meetup',
        'meetup.id = flag.entityId AND flag.entityType = :entityType',
        { entityType: 'meetup' },
      )
      .addSelect(['meetup.*'])
      .where({
        userId: userId,
      })
      .getMany();

    // const rows = await this.flagRepository.manager.query(
    //   'SELECT feed.* FROM \
    //   FROM `flag` \
    //   INNER JOIN `feed` ON feed.id = flag.entityId \
    //   WHERE userId = ? AND entityType = ?',
    //   [userId, `meetup`],
    // );
    // return rows;
  }

  // Meetup 을 차단한 user 리스트
  async getFlaggingUsersByMeetupId(meetupId: number): Promise<any[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT user.* FROM \
      FROM `flag` \
      INNER JOIN `user` ON user.id = flag.userId \
      WHERE entityId = ? AND entityType = ?',
      [meetupId, `meetup`],
    );

    return rows;

    // return rows.map((v: Flag) => v.feedId);
  }

  // 내가 북마크한 feed 여부
  async isReported(
    userId: number,
    entityType: string,
    entityId: number,
  ): Promise<AnyData> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, entityType, entityId],
    );
    const { count } = row;

    return { data: +count };
  }
}
