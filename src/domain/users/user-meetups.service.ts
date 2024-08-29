import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { ConfigService } from '@nestjs/config';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { DataSource } from 'typeorm';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Like } from 'src/domain/users/entities/like.entity';

@Injectable()
export class UserMeetupsService {
  private readonly env: any;
  private readonly logger = new Logger(UserMeetupsService.name);

  constructor(
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? My Meetups
  //? ----------------------------------------------------------------------- //

  // 내가 만든 모임 리스트
  async findMyMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.room', 'room')
      .leftJoinAndSelect('room.participants', 'participants')
      .where('meetup.userId = :userId', {
        userId,
      });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 만든 Meetup 리스트 (all)
  async loadMyMeetups(userId: number): Promise<Meetup[]> {
    return await this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .where({
        userId,
      })
      .getMany();
  }

  // 내가 만든 Meetup Ids 리스트 (all)
  async loadMyMeetupIds(userId: number): Promise<number[]> {
    const items = await this.meetupRepository
      .createQueryBuilder('meetup')
      .where({
        userId,
      })
      .getMany();
    return items.map((v) => v.id);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  async createMeetupBookmark(
    userId: number,
    meetupId: number,
  ): Promise<Bookmark> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Bookmark).create({
          userId,
          entityType: 'meetup',
          entityId: meetupId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `meetup` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [meetupId],
      );

      await queryRunner.commitTransaction();
      return bookmark;
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

  async deleteMeetupBookmark(userId: number, meetupId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark` WHERE userId = ? AND entityType = ? AND entityId = ?',
        [userId, `meetup`, meetupId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `meetup` SET bookmarkCount = bookmarkCount - 1 WHERE id = ? AND bookmarkCount > 0',
          [meetupId],
        );
      }
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Meetup 북마크 여부
  async isMeetupBookmarked(userId: number, meetupId: number): Promise<boolean> {
    const [row] = await this.bookmarkRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `meetup`, meetupId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크한 Meetups
  //? ----------------------------------------------------------------------- //

  // 내가 북마크한 Meetups (paginated)
  async listBookmarkedMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoin(Bookmark, 'bookmark', 'bookmark.entityId = meetup.id')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('bookmark.entityType = :entityType', { entityType: 'meetup' });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 Meetups
  async loadBookmarkedMeetups(userId: number): Promise<Meetup[]> {
    const queryBuilder = this.meetupRepository.createQueryBuilder('meetup');
    return await queryBuilder
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.entityId = meetup.id AND bookmark.entityType = :entityType',
        { entityType: 'meetup' },
      )
      .addSelect(['meetup.*'])
      .where('bookmark.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 MeetupIds
  async loadBookmarkedMeetupIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkRepository.manager.query(
      'SELECT entityId FROM `bookmark` \
      WHERE bookmark.entityType = ? AND bookmark.userId = ?',
      [`meetup`, userId],
    );

    return rows.map((v: any) => v.entityId);
  }

  //? ----------------------------------------------------------------------- //
  //? Meetup Like 좋아요 생성
  //? ----------------------------------------------------------------------- //

  // Meetup 좋아요 생성
  async createMeetupLike(userId: number, meetupId: number): Promise<Like> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const like = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Like).create({
          userId,
          entityType: 'meetup',
          entityId: meetupId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `meetup` SET likeCount = likeCount + 1 WHERE id = ?',
        [meetupId],
      );
      await queryRunner.commitTransaction();
      return like;
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

  // Meetup 좋아요 제거
  async deleteMeetupLike(userId: number, meetupId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `like` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `meetup`, meetupId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `meetup` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
          [meetupId],
        );
      }
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Meetup 좋아요 여부
  async isMeetupLiked(userId: number, meetupId: number): Promise<boolean> {
    const [row] = await this.likeRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `like` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `meetup`, meetupId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 좋아요한 Meetups
  //? ----------------------------------------------------------------------- //

  // 내가 좋아요한 Meetups (paginated)
  async listLikedMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoin(Like, 'like', 'like.entityId = meetup.id')
      .where('like.userId = :userId', { userId })
      .andWhere('like.entityType = :entityType', { entityType: 'meetup' });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 좋아요한 모든 Meetups
  async loadLikedMeetups(userId: number): Promise<Meetup[]> {
    const queryBuilder = this.meetupRepository.createQueryBuilder('meetup');
    return await queryBuilder
      .innerJoinAndSelect(
        Like,
        'like',
        'like.entityId = meetup.id AND like.entityType = :entityType',
        { entityType: 'meetup' },
      )
      .addSelect(['meetup.*'])
      .where('like.userId = :userId', { userId })
      .getMany();
  }

  // 내가 좋아요한 모든 MeetupIds
  async loadLikedMeetupIds(userId: number): Promise<number[]> {
    const rows = await this.likeRepository.manager.query(
      'SELECT entityId FROM `like` \
      WHERE like.entityType = ? AND like.userId = ?',
      [`meetup`, userId],
    );

    return rows.map((v: any) => v.entityId);
  }

  //? ----------------------------------------------------------------------- //
  //? Meetup Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  // Meetup 신고 생성
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
  async deleteMeetupFlag(userId: number, meetupId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `meetup`, meetupId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `meetup` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [meetupId],
        );
      }
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Meetup 신고 여부
  async isMeetupFlagged(userId: number, meetupId: number): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `meetup`, meetupId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 신고한 Meetups
  //? ----------------------------------------------------------------------- //

  // 내가 신고한 Meetups (paginated)
  async listFlaggedMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoin(Flag, 'flag', 'flag.entityId = meetup.id')
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
    return await queryBuilder
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
      WHERE flag.entityType = ? AND flag.userId = ?',
      [`meetup`, userId],
    );

    return rows.map((v: any) => v.entityId);
  }
}
