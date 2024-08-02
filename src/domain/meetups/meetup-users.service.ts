import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';

@Injectable()
export class MeetupUsersService {
  private readonly env: any;
  private readonly logger = new Logger(MeetupUsersService.name);

  constructor(
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 참가 신청/초대 (Join) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 모임에 신청한 Join 리스트 (message 를 볼 수 있어야 하므로)
  async loadAllJoiners(meetupId: number): Promise<Join[]> {
    try {
      const meetup = await this.meetupRepository.findOneOrFail({
        where: {
          id: meetupId,
        },
        relations: ['joins', 'joins.user', 'joins.recipient'],
      });
      return meetup.joins.filter((v) => v.recipient.id === meetup.userId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // 이 모임에 초대한 Join 리스트 (message 를 볼 수 있어야 하므로)
  async loadAllInvitees(meetupId: number): Promise<Join[]> {
    try {
      const meetup = await this.meetupRepository.findOneOrFail({
        where: {
          id: meetupId,
        },
        relations: ['joins', 'joins.user', 'joins.recipient'],
      });

      return meetup.joins.filter((v) => v.user.id === meetup.userId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크 (BookmarkUserMeetup) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 모임을 북마크/찜한 모든 Users
  async loadBookmarkers(meetupId: number): Promise<User[]> {
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

  // 이 모임을 북마크/찜한 모든 UserIds
  async loadBookmarkerIds(meetupId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `bookmark_user_meetup` \
      WHERE bookmark_user_meetup.meetupId = ?',
      [meetupId],
    );

    return rows.map((v: any) => v.userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 모임을 신고한 모든 Users (all)
  async loadMeetupFlaggingUsers(meetupId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .leftJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where('flag.entityType = :entityType AND flag.entityId = :meetupId', {
        entityType: `meetup`,
        meetupId,
      })
      .getMany();
  }

  // 이 모임을 신고한 모든 UserIds (all)
  async loadMeetupFlaggingUserIds(meetupId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = ? AND flag.entityId = ?',
      [`meetup`, meetupId],
    );

    return rows.map((v: any) => v.userId);
  }
}
