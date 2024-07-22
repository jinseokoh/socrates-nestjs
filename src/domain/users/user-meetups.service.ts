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
import { JoinType, JoinStatus } from 'src/common/enums';
import { AnyData } from 'src/common/types';
import { ConfigService } from '@nestjs/config';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { Room } from 'src/domain/chats/entities/room.entity';

@Injectable()
export class UserMeetupsService {
  private readonly env: any;
  private readonly logger = new Logger(UserMeetupsService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(Join)
    private readonly joinRepository: Repository<Join>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? My Meetups
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

  //! ------------------------------------------------------------------------//
  //! Join Pivot
  //! ------------------------------------------------------------------------//

  // 모임신청 리스트에 추가
  async attachToJoinPivot(
    askingUserId: number,
    askedUserId: number,
    meetupId: number,
    dto: CreateJoinDto,
  ): Promise<Meetup> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: meetupId },
      relations: ['joins', 'user', 'user.profile'],
    });

    let joinType = JoinType.REQUEST;
    if (meetup.userId == askedUserId) {
      // 1. 방장에게 신청하는 경우, 30명 까지로 제한.
      if (
        meetup.joins.filter((v) => meetup.userId === v.askedUserId).length > 30
      ) {
        throw new NotAcceptableException('max limit reached');
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

      // notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'meetupRequest';
      event.userId = meetup.user.id;
      event.token = meetup.user.pushToken;
      event.options = meetup.user.profile?.options ?? {};
      event.body = `${meetup.title} 모임에 누군가 참가신청을 했습니다.`;
      event.data = {
        page: `meetups/${meetupId}`,
        args: '',
      };
      this.eventEmitter.emit('user.notified', event);

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
    let chatOpen = false;
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.manager.query(
        'UPDATE `join` SET status = ? WHERE askingUserId = ? AND askedUserId = ? AND meetupId = ?',
        [status, askingUserId, askedUserId, meetupId],
      );

      //? room record 생성
      if (status === JoinStatus.ACCEPTED) {
        if (joinType === JoinType.REQUEST) {
          // 모임 신청 (add askingUserId to `room`) 수락
          await queryRunner.manager.query(
            'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
            ['guest', askingUserId, meetupId],
          );
        } else {
          // 모임 초대 (add askedUserId to `room`) 수락
          await queryRunner.manager.query(
            'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
            ['guest', askedUserId, meetupId],
          );
        }

        const [{ max }] = await queryRunner.manager.query(
          'SELECT max FROM `meetup` WHERE id = ?',
          [meetupId],
        );
        const [{ count }] = await queryRunner.manager.query(
          'SELECT COUNT(*) AS count FROM `room` WHERE meetupId = ?',
          [meetupId],
        );
        if (max > +count) {
          // no need to do anything.
        } else if (max === +count) {
          await queryRunner.manager.query(
            'UPDATE `meetup` SET isFull = 1 WHERE id = ?',
            [meetupId],
          );
          chatOpen = true;
        } else {
          // forget it. we have no rooms left.
          throw new BadRequestException(`no vacancy`);
        }
        await queryRunner.commitTransaction();
      }

      if (status === JoinStatus.ACCEPTED) {
        const meetup = await queryRunner.manager.findOneOrFail(Meetup, {
          where: { id: meetupId },
          relations: [`rooms`, `rooms.user`, `rooms.user.profile`],
        });

        const recipient = await queryRunner.manager.findOneOrFail(User, {
          where: { id: askingUserId },
          relations: [`profile`],
        });
        // notification with event listener ----------------------------------//
        const event = new UserNotificationEvent();
        if (joinType === JoinType.REQUEST) {
          event.name = 'meetupRequestApproval';
          event.token = recipient.pushToken;
          event.options = recipient.profile?.options ?? {};
          event.body = `${meetup.title} 모임장이 나의 참가신청을 수락했습니다.`;
          event.data = {
            page: `meetups/${meetupId}`,
            args: '',
          };
        } else {
          event.name = 'meetupInviteApproval';
          event.userId = recipient.id;
          event.token = recipient.pushToken;
          event.options = recipient.profile?.options ?? {};
          event.body = `${meetup.title} 모임으로의 초대를 상대방이 수락했습니다.`;
          event.data = {
            page: `meetups/${meetupId}`,
            args: '',
          };
        }
        this.eventEmitter.emit('user.notified', event);
        // notification with event listener ----------------------------------//
        if (chatOpen) {
          meetup.rooms.map((v: Room) => {
            const event = new UserNotificationEvent();
            event.name = 'chatOpen';
            event.userId = v.user.id;
            event.token = v.user.pushToken;
            event.options = v.user.profile?.options ?? {};
            event.body = `${meetup.title} 모임 참가자가 모두 확정되어 채팅방이 열렸습니다.`;
            event.data = {
              page: `meetups/${meetupId}`,
              args: 'load:chat',
            };
            this.eventEmitter.emit('user.notified', event);
          });
        }
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
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
