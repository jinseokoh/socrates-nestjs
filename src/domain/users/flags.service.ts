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
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ------------------------------------------------------------------------//
  //? Feed
  //? ------------------------------------------------------------------------//

  // Feed 신고 생성
  // 가능하다면, feed flagCount 증가
  async createFeedFlag(
    userId: number,
    feedId: number,
    message: string,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(Flag)
          .create({ userId, entityType: 'feed', entityId: feedId, message }),
      );
      await queryRunner.manager.query(
        'UPDATE `feed` SET flagCount = flagCount + 1 WHERE id = ?',
        [feedId],
      );
      await queryRunner.commitTransaction();
      return flag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // Feed 신고 제거
  // 가능하다면, feed flagCount 감소
  async deleteFeedFlag(userId: number, feedId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = `feed` AND entityId = ?',
        [userId, feedId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `feed` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [feedId],
        );
      }
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 내가 북마크한 Feed 여부
  async isFeedFlagged(userId: number, feedId: number): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = `feed` AND entityId = ?',
      [userId, feedId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 신고한 Feeds (paginated)
  async findFlaggedFeeds(
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
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Feeds
  async loadFlaggedFeeds(userId: number): Promise<Feed[]> {
    const queryBuilder = this.feedRepository.createQueryBuilder('feed');
    return queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = feed.id AND flag.entityType = :entityType',
        { entityType: 'feed' },
      )
      .addSelect(['feed.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 FeedIds
  async loadFlaggedFeedIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.userId = ? AND flag.entityType = ?',
      [userId, 'feed'],
    );

    return rows.map((v: any) => v.entityId);
  }
  //? ------------------------------------------------------------------------//
  //? Meetup
  //? ------------------------------------------------------------------------//

  // Meetup 신고 생성
  // 가능하다면, meetup flagCount 증가
  async createMeetupFlag(
    userId: number,
    meetupId: number,
    message: string,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({
          userId,
          entityType: 'meetup',
          entityId: meetupId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `meetup` SET flagCount = flagCount + 1 WHERE id = ?',
        [meetupId],
      );
      await queryRunner.commitTransaction();
      return flag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // Meetup 신고 제거
  // 가능하다면, meetup flagCount 감소
  async deleteMeetupFlag(userId: number, meetupId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = `meetup` AND entityId = ?',
        [userId, meetupId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `meetup` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [meetupId],
        );
      }
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 내가 북마크한 Meetup 여부
  async isMeetupFlagged(userId: number, meetupId: number): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = `meetup` AND entityId = ?',
      [userId, meetupId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 신고한 Meetups (paginated)
  async findFlaggedMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoin(Flag, 'flag', 'meetup.id = flag.entityId')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', { entityType: 'meetup' });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Meetups
  async loadFlaggedMeetups(userId: number): Promise<Meetup[]> {
    const queryBuilder = this.meetupRepository.createQueryBuilder('meetup');
    return queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = meetup.id AND flag.entityType = :entityType',
        { entityType: 'meetup' },
      )
      .addSelect(['meetup.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 MeetupIds
  async loadFlaggedMeetupIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.entityId = ? AND flag.entityType = `meetup`',
      [userId],
    );

    return rows.map((v: any) => v.entityId);
  }

  //? 새롭게 추가 -----------------------------------------------------------------//

  // Meetup 을 차단한 User 리스트
  async loadFlaggingUsers(meetupId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return queryBuilder
      .innerJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where('flag.entityType = `meetup` AND flag.entityId = :meetupId', {
        meetupId,
      })
      .getMany();
  }

  // Meetup 을 차단한 UserIds
  async loadFlaggingUserIds(meetupId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = `meetup` AND flag.entity.id = ?',
      [meetupId],
    );

    return rows.map((v: any) => v.userId);
  }
}
