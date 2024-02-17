import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JoinType, JoinStatus } from 'src/common/enums';
import { AnyData } from 'src/common/types';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { ReportMeetup } from 'src/domain/meetups/entities/report_meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UsersMeetupService {
  private readonly env: any;
  private readonly logger = new Logger(UsersMeetupService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Join)
    private readonly joinRepository: Repository<Join>,
    @InjectRepository(ReportMeetup)
    private readonly reportMeetupRepository: Repository<ReportMeetup>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Meetups
  //?-------------------------------------------------------------------------//

  // 내가 만든 모임 리스트
  async getMyMeetups(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        userId,
      });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
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

  //?-------------------------------------------------------------------------//
  //? Like Pivot
  //?-------------------------------------------------------------------------//

  // 나의 찜 리스트에 추가
  async attachToLikePivot(userId: number, meetupId: number): Promise<any> {
    const [row] = await this.repository.query(
      'SELECT COUNT(*) AS cnt FROM `like` WHERE userId = ?',
      [userId],
    );
    const count = row.cnt;
    if (+count > 30) {
      throw new NotAcceptableException('reached maximum count');
    }

    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `like` (userId, meetupId) VALUES (?, ?)',
      [userId, meetupId],
    );

    if (affectedRows > 0) {
      await this.meetupRepository.increment({ id: meetupId }, 'likeCount', 1);
    }
  }

  // 나의 찜 리스트에서 삭제
  async detachFromLikePivot(userId: number, meetupId: number): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `like` WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      // the following doesn't work at times.
      // await this.meetupRrepository.decrement({ meetupId }, 'likeCount', 1);
      //
      // we need to make the likeCount always positive.
      await this.repository.manager.query(
        'UPDATE `meetup` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
        [meetupId],
      );
    }
  }

  // 내가 찜한 모임 리스트 (paginated)
  async getMeetupsLikedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Like>> {
    const queryBuilder = this.likeRepository
      .createQueryBuilder('like')
      .innerJoinAndSelect('like.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        userId,
      });

    const config: PaginateConfig<Like> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 찜한 모임 ID 리스트 (all; 최대30)
  async getMeetupIdsLikedByMe(userId: number): Promise<number[]> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `like` ON `user`.id = `like`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return items.map(({ meetupId }) => meetupId);
  }

  //?-------------------------------------------------------------------------//
  //? ReportMeetup Pivot
  //?-------------------------------------------------------------------------//

  // 차단한 모임 리스트에 추가
  async attachToReportMeetupPivot(
    userId: number,
    meetupId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `report_meetup` (userId, meetupId, message) VALUES (?, ?, ?)',
      [userId, meetupId, message],
    );
    if (affectedRows > 0) {
      await this.meetupRepository.increment({ id: meetupId }, 'reportCount', 1);
    }
  }

  // 차단한 모임 리스트에서 삭제
  async detachFromReportMeetupPivot(
    userId: number,
    meetupId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `report_meetup` WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      // await this.meetupRrepository.decrement({ meetupId }, 'reportCount', 1);
      await this.repository.manager.query(
        'UPDATE `meetup` SET reportCount = reportCount - 1 WHERE id = ? AND reportCount > 0',
        [meetupId],
      );
    }
  }

  // 내가 차단한 모임 리스트 (paginated)
  async getMeetupsReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportMeetup>> {
    const queryBuilder = this.reportMeetupRepository
      .createQueryBuilder('reportMeetup')
      .leftJoinAndSelect('reportMeetup.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .where({
        userId,
      });

    const config: PaginateConfig<ReportMeetup> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 차단한 모임ID 리스트 (all)
  async getMeetupIdsReportedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `report_meetup` ON `user`.id = `report_meetup`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  //?-------------------------------------------------------------------------//
  //? Join Pivot
  //?-------------------------------------------------------------------------//

  // 모임신청 리스트에 추가
  async attachToJoinPivot(
    askingUserId: number,
    askedUserId: number,
    meetupId: number,
    dto: CreateJoinDto,
  ): Promise<Meetup> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: meetupId },
      relations: ['joins'],
    });

    let joinType = JoinType.REQUEST;
    if (meetup.userId == askedUserId) {
      // 1. 방장에게 신청하는 경우, 30명 까지로 제한.
      if (
        meetup.joins.filter((v) => meetup.userId === v.askedUserId).length > 30
      ) {
        throw new NotAcceptableException('reached maximum count');
      }
      // await this.attachToLikePivot(askingUserId, meetupId);
    } else {
      // 2. 방장이 초대하는 경우, 갯수 제한 없음.
      joinType = JoinType.INVITATION;
    }

    try {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `join` (askingUserId, askedUserId, meetupId, message, skill, joinType) VALUES (?, ?, ?, ?, ?, ?)',
        [askingUserId, askedUserId, meetupId, dto.message, dto.skill, joinType],
      );
      return meetup;
    } catch (e) {
      throw new BadRequestException('database has gone crazy.');
    }
  }

  // 모임신청 승인/거부
  async updateJoinToAcceptOrDeny(
    askingUserId: number,
    askedUserId: number,
    meetupId: number,
    status: JoinStatus,
    joinType: JoinType,
  ): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `join` SET status = ? WHERE askingUserId = ? AND askedUserId = ? AND meetupId = ?',
      [status, askingUserId, askedUserId, meetupId],
    );

    //? room record 생성
    if (status === JoinStatus.ACCEPTED) {
      if (joinType === JoinType.REQUEST) {
        // 모임 신청 (add askingUserId to `room`)
        await this.repository.manager.query(
          'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
          ['guest', askingUserId, meetupId],
        );
      } else {
        // 모임 초대 (add askedUserId to `room`)
        await this.repository.manager.query(
          'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
          ['guest', askedUserId, meetupId],
        );
      }

      const [{ max }] = await this.repository.manager.query(
        'SELECT max FROM `meetup` WHERE id = ?',
        [meetupId],
      );
      const [{ count }] = await this.repository.manager.query(
        'SELECT COUNT(*) AS count FROM `room` WHERE meetupId = ?',
        [meetupId],
      );

      if (max >= +count) {
        await this.repository.manager.query(
          'UPDATE `meetup` SET isFull = 1 WHERE id = ?',
          [meetupId],
        );
      }
    }
  }

  //? 내가 신청(request)한 모임 리스트 (paginated)
  async getMeetupsRequested(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .innerJoinAndSelect('join.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        joinType: JoinType.REQUEST,
        askingUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //? 내가 신청한 모임ID 리스트 (all)
  async getMeetupIdsRequested(userId: number): Promise<number[]> {
    const items = await this.repository.manager.query(
      'SELECT meetupId FROM `join` \
INNER JOIN `user` ON `user`.id = `join`.askingUserId \
INNER JOIN `meetup` ON `meetup`.id = `join`.meetupId \
WHERE `joinType` = ? AND `user`.id = ?',
      [JoinType.REQUEST, userId],
    );

    return items.map(({ meetupId }) => meetupId);
  }

  //? 내가 초대(invitation)받은 모임 리스트 (paginated)
  async getMeetupsInvited(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .innerJoinAndSelect('join.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        joinType: JoinType.INVITATION,
        askedUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //? 나를 초대한 모임ID 리스트 (all)
  async getMeetupIdsInvited(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId FROM `join` \
INNER JOIN `user` ON `user`.id = `join`.askedUserId \
INNER JOIN `meetup` ON `meetup`.id = `join`.meetupId \
WHERE `joinType` = ? AND `user`.id = ?',
      [JoinType.INVITATION, userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }
}
