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
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BookmarkUserMeetupService {
  private readonly env: any;
  private readonly logger = new Logger(BookmarkUserMeetupService.name);

  constructor(
    @InjectRepository(BookmarkUserMeetup)
    private readonly bookmarkUserMeetupRepository: Repository<BookmarkUserMeetup>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? BookmarkUserMeetup Pivot
  //?-------------------------------------------------------------------------//

  // Meetup 북마크 생성
  // meetup 의 bookmarkCount++
  async createMeetupBookmark(
    userId: number,
    meetupId: number,
  ): Promise<BookmarkUserMeetup> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(BookmarkUserMeetup)
          .create({ userId, meetupId }),
      );
      await queryRunner.manager.query(
        'UPDATE `meetup` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [meetupId],
      );

      if (false) {
        // notification with event listener ------------------------------------//
        const meetup = await queryRunner.manager.findOneOrFail(Meetup, {
          where: { id: meetupId },
          relations: [`user`, `user.profile`],
        });
        // todo. fine tune notifying logic to dedup the same id
        const event = new UserNotificationEvent();
        event.name = 'meetupBookmark';
        event.userId = meetup.user.id;
        event.token = meetup.user.pushToken;
        event.options = meetup.user.profile?.options ?? {};
        event.body = `${meetup.title} 모임에 누군가 찜을 했습니다.`;
        event.data = {
          page: `meetups/${meetupId}`,
          args: '',
        };
        this.eventEmitter.emit('user.notified', event);
      }

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

  // Meetup 북마크 제거
  // meetup 의 bookmarkCount--
  async deleteMeetupBookmark(userId: number, meetupId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark_user_meetup` WHERE userId = ? AND meetupId = ?',
        [userId, meetupId],
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
    const [row] = await this.bookmarkUserMeetupRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark_user_meetup` \
      WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 북마크한 Meetups (paginated)
  async findBookmarkedMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect(
        BookmarkUserMeetup,
        'bookmark_user_meetup',
        'bookmark_user_meetup.meetupId = meetup.id',
      )
      .innerJoinAndSelect('meetup.user', 'user')
      .where('bookmark_user_meetup.userId = :userId', { userId });

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
        BookmarkUserMeetup,
        'bookmark_user_meetup',
        'bookmark_user_meetup.meetupId = meetup.id',
      )
      .addSelect(['meetup.*'])
      .where('bookmark_user_meetup.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 MeetupIds
  async loadBookmarkedMeetupIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserMeetupRepository.manager.query(
      'SELECT meetupId FROM `bookmark_user_meetup` \
      WHERE bookmark_user_meetup.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.meetupId);
  }

  //? 새롭게 추가 -----------------------------------------------------------------//

  // Meetup 을 북마크/찜한 Users
  async loadBookmarkingUsers(meetupId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        BookmarkUserMeetup,
        'bookmark_user_meetup',
        'bookmark_user_meetup.userId = user.id',
      )
      .addSelect(['user.*'])
      .where('bookmark_user_meetup.meetupId = :meetupId', {
        meetupId,
      })
      .getMany();
  }

  // Meetup 을 북마크/찜한 UserIds
  async loadBookmarkingUserIds(meetupId: number): Promise<number[]> {
    const rows = await this.bookmarkUserMeetupRepository.manager.query(
      'SELECT userId FROM `bookmark_user_meetup` \
      WHERE bookmark_user_meetup.meetupId = ?',
      [meetupId],
    );

    return rows.map((v: any) => v.userId);
  }
}
