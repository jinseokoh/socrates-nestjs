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
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class FlagMeetupService {
  private readonly env: any;
  private readonly logger = new Logger(FlagMeetupService.name);

  constructor(
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? Meetup
  //? ----------------------------------------------------------------------- //

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
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `meetup`, meetupId],
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

  //? 새롭게 추가 -----------------------------------------------------------------//

  // Meetup 을 신고한 Users
  async loadMeetupFlaggingUsers(meetupId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where('flag.entityType = :entityType AND flag.entityId = :meetupId', {
        entityType: `meetup`,
        meetupId,
      })
      .getMany();
  }

  // Meetup 을 신고한 UserIds
  async loadMeetupFlaggingUserIds(meetupId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = ? AND flag.entityId = ?',
      [`meetup`, meetupId],
    );

    return rows.map((v: any) => v.userId);
  }
}
