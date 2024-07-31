import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { JoinRequestType, JoinStatus } from 'src/common/enums';
import { ConfigService } from '@nestjs/config';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { Participant } from 'src/domain/chats/entities/participant.entity';

@Injectable()
export class UserJoinsService {
  private readonly env: any;
  private readonly logger = new Logger(UserJoinsService.name);

  constructor(
    @InjectRepository(Join)
    private readonly joinRepository: Repository<Join>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? 모임신청/초대 생성 (생성 갯수제한 없도록 수정함.)
  async createJoin(
    userId: number,
    recipientId: number,
    meetupId: number,
    dto: CreateJoinDto,
  ): Promise<Meetup> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: meetupId },
      relations: ['joins', 'user', 'user.profile'],
    });
    //! joinType 은 semantic 에 맞게 자동설정.
    const joinType =
      meetup.userId == recipientId
        ? JoinRequestType.REQUEST
        : JoinRequestType.INVITATION;

    try {
      await this.userRepository.manager.query(
        'INSERT IGNORE INTO `join` \
  (userId, recipientId, meetupId, message, skill, joinType) VALUES (?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  recipientId = VALUES(`recipientId`), \
  meetupId = VALUES(`meetupId`), \
  message = VALUES(`message`), \
  skill = VALUES(`skill`), \
  joinType = VALUES(`joinType`)',
        [userId, recipientId, meetupId, dto.message, dto.skill, joinType],
      );

      // notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'meetup';
      event.userId = meetup.user.id;
      event.token = meetup.user.pushToken;
      event.options = meetup.user.profile?.options ?? {};
      event.body = `${meetup.title} 모임에 누군가 참가신청을 했습니다.`;
      event.data = {
        page: `meetups/${meetupId}`,
      };
      this.eventEmitter.emit('user.notified', event);

      return meetup;
    } catch (e) {
      throw new BadRequestException('database has gone crazy.');
    }
  }

  //? 모임신청 승인/거부
  // todo. need to populate room and participants automatically.
  async updateJoinToAcceptOrDeny(
    userId: number,
    recipientId: number,
    meetupId: number,
    status: JoinStatus,
  ): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const meetup = await queryRunner.manager.findOneOrFail(Meetup, {
        where: [{ id: meetupId }],
      });
      //! joinType 은 semantic 에 맞게 자동설정.
      const joinType =
        meetup.userId == recipientId
          ? JoinRequestType.REQUEST
          : JoinRequestType.INVITATION;

      await queryRunner.manager.query(
        'UPDATE `join` SET status = ? WHERE userId = ? AND recipientId = ? AND meetupId = ?',
        [status, userId, recipientId, meetupId],
      );

      //? 채팅방 참가자 (room participants) 레코드 생성
      // if (status === JoinStatus.ACCEPTED) {
      //   if (joinType === JoinRequestType.REQUEST) {
      //     // 모임 신청 (add userId to `room`) 수락
      //     await queryRunner.manager.query(
      //       'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
      //       ['guest', userId, meetupId],
      //     );
      //   } else {
      //     // 모임 초대 (add recipientId to `room`) 수락
      //     await queryRunner.manager.query(
      //       'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
      //       ['guest', recipientId, meetupId],
      //     );
      //   }

      //   const [{ max }] = await queryRunner.manager.query(
      //     'SELECT max FROM `meetup` WHERE id = ?',
      //     [meetupId],
      //   );
      //   const [{ count }] = await queryRunner.manager.query(
      //     'SELECT COUNT(*) AS `count` FROM `room` WHERE meetupId = ?',
      //     [meetupId],
      //   );
      //   if (max > +count) {
      //     // no need to do anything.
      //   } else if (max === +count) {
      //     await queryRunner.manager.query(
      //       'UPDATE `meetup` SET isFull = 1 WHERE id = ?',
      //       [meetupId],
      //     );
      //     chatOpen = true;
      //   } else {
      //     // forget it. we have no rooms left.
      //     throw new BadRequestException(`no vacancy`);
      //   }
      //   await queryRunner.commitTransaction();
      // }

      //? 안내 이벤트 발송
      // if (status === JoinStatus.ACCEPTED) {
      //   const meetup = await queryRunner.manager.findOneOrFail(Meetup, {
      //     where: { id: meetupId },
      //     relations: [`rooms`, `rooms.user`, `rooms.user.profile`],
      //   });

      //   const recipient = await queryRunner.manager.findOneOrFail(User, {
      //     where: { id: userId },
      //     relations: [`profile`],
      //   });
      //   // notification with event listener ----------------------------------//
      //   const event = new UserNotificationEvent();
      //   if (joinType === JoinRequestType.REQUEST) {
      //     event.name = 'meetup';
      //     event.token = recipient.pushToken;
      //     event.options = recipient.profile?.options ?? {};
      //     event.body = `${meetup.title} 모임장이 나의 참가신청을 수락했습니다.`;
      //     event.data = {
      //       page: `meetups/${meetupId}`,
      //       args: '',
      //     };
      //   } else {
      //     event.name = 'meetup';
      //     event.userId = recipient.id;
      //     event.token = recipient.pushToken;
      //     event.options = recipient.profile?.options ?? {};
      //     event.body = `${meetup.title} 모임으로의 초대를 상대방이 수락했습니다.`;
      //     event.data = {
      //       page: `meetups/${meetupId}`,
      //       args: '',
      //     };
      //   }
      //   this.eventEmitter.emit('user.notified', event);
      //   // notification with event listener ----------------------------------//
      //   if (chatOpen) {
      //     meetup.room.participants.map((v: Participant) => {
      //       // todo. need to check out this part later
      //       const event = new UserNotificationEvent();
      //       event.name = 'chat';
      //       event.userId = v.user.id;
      //       event.token = v.user.pushToken;
      //       event.options = v.user.profile?.options ?? {};
      //       event.body = `${meetup.title} 모임 참가자가 모두 확정되어 채팅방이 열렸습니다.`;
      //       event.data = {
      //         page: `meetups/${meetupId}`,
      //         args: 'load:chat',
      //       };
      //       this.eventEmitter.emit('user.notified', event);
      //     });
      //   }
      // }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.name === 'EntityNotFoundError') {
        //! TypeORM의 EntityNotFoundError 감지
        throw new NotFoundException(`entity not found`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  //? 내가 신청(request)한 모임 리스트 (paginated)
  async listMeetupsRequested(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect(Join, 'join', 'join.meetupId = meetup.id')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.room', 'room')
      .leftJoinAndSelect('room.participants', 'participants')
      .where('join.joinType = :joinType', { joinType: JoinRequestType.REQUEST })
      .andWhere('join.userId = :userId', { userId });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //? 내가 신청한 모임ID 리스트 (all)
  async loadMeetupIdsRequested(userId: number): Promise<number[]> {
    const items = await this.userRepository.manager.query(
      'SELECT meetupId FROM `join` \
INNER JOIN `user` ON `user`.id = `join`.userId \
INNER JOIN `meetup` ON `meetup`.id = `join`.meetupId \
WHERE `joinType` = ? AND `user`.id = ?',
      [JoinRequestType.REQUEST, userId],
    );

    return items.map(({ meetupId }) => meetupId);
  }

  //? 내가 초대(invitation)받은 모임 리스트 (paginated)
  async listMeetupsInvited(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect(Join, 'join', 'join.meetupId = meetup.id')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.room', 'room')
      .leftJoinAndSelect('room.participants', 'participants')
      .where('join.joinType = :joinType', { joinType: JoinRequestType.REQUEST })
      .andWhere('join.recipientId = :userId', { userId });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //? 나를 초대한 모임ID 리스트 (all)
  async loadMeetupIdsInvited(userId: number): Promise<number[]> {
    const items = await this.userRepository.manager.query(
      'SELECT meetupId FROM `join` \
INNER JOIN `user` ON `user`.id = `join`.recipientId \
INNER JOIN `meetup` ON `meetup`.id = `join`.meetupId \
WHERE `joinType` = ? AND `user`.id = ?',
      [JoinRequestType.INVITATION, userId],
    );

    return items.map(({ meetupId }) => +meetupId);
  }
}
