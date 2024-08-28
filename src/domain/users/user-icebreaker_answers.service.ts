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
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { Repository } from 'typeorm/repository/Repository';
import { BookmarkUserIcebreaker } from 'src/domain/users/entities/bookmark_user_icebreaker.entity';
import { DataSource } from 'typeorm';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Like } from 'src/domain/users/entities/like.entity';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { BookmarkUserIcebreakerAnswer } from 'src/domain/users/entities/bookmark_user_icebreaker_answer.entity';

@Injectable()
export class UserIcebreakerAnswersService {
  private readonly env: any;
  private readonly logger = new Logger(UserIcebreakerAnswersService.name);

  constructor(
    @InjectRepository(IcebreakerAnswer)
    private readonly icebreakerAnswerRepository: Repository<IcebreakerAnswer>,
    @InjectRepository(BookmarkUserIcebreakerAnswer)
    private readonly bookmarkUserIcebreakerAnswerRepository: Repository<BookmarkUserIcebreakerAnswer>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? My Icebreaker Answers
  //? ----------------------------------------------------------------------- //

  // 내가 만든 모임 리스트
  async findMyIcebreakerAnswers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('icebreaker')
      .leftJoinAndSelect('icebreaker.venue', 'venue')
      .leftJoinAndSelect('icebreaker.user', 'user')
      .leftJoinAndSelect('icebreaker.room', 'room')
      .leftJoinAndSelect('room.participants', 'participants')
      .where('icebreaker.userId = :userId', {
        userId,
      });

    const config: PaginateConfig<Icebreaker> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
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

  // 내가 만든 Icebreaker 리스트 (all)
  async loadMyIcebreakers(userId: number): Promise<Icebreaker[]> {
    return await this.icebreakerRepository
      .createQueryBuilder('icebreaker')
      .innerJoinAndSelect('icebreaker.venue', 'venue')
      .innerJoinAndSelect('icebreaker.user', 'user')
      .where({
        userId,
      })
      .getMany();
  }

  // 내가 만든 Icebreaker Ids 리스트 (all)
  async loadMyIcebreakerIds(userId: number): Promise<number[]> {
    const items = await this.icebreakerRepository
      .createQueryBuilder('icebreaker')
      .where({
        userId,
      })
      .getMany();
    return items.map((v) => v.id);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(BookmarkUserIcebreaker) 생성
  //? ----------------------------------------------------------------------- //

  async createIcebreakerBookmark(
    userId: number,
    icebreakerId: number,
  ): Promise<BookmarkUserIcebreaker> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(BookmarkUserIcebreaker)
          .create({ userId, icebreakerId }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [icebreakerId],
      );

      if (false) {
        // notification with event listener ------------------------------------//
        const icebreaker = await queryRunner.manager.findOneOrFail(Icebreaker, {
          where: { id: icebreakerId },
          relations: [`user`, `user.profile`],
        });
        // todo. fine tune notifying logic to dedup the same id
        const event = new UserNotificationEvent();
        event.name = 'icebreaker';
        event.userId = icebreaker.user.id;
        event.token = icebreaker.user.pushToken;
        event.options = icebreaker.user.profile?.options ?? {};
        event.body = `${icebreaker.body} 질문에 누군가 답변을 했습니다.`;
        event.data = {
          page: `icebreakers/${icebreakerId}`,
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

  async deleteIcebreakerBookmark(
    userId: number,
    icebreakerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark_user_icebreaker` WHERE userId = ? AND icebreakerId = ?',
        [userId, icebreakerId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker` SET bookmarkCount = bookmarkCount - 1 WHERE id = ? AND bookmarkCount > 0',
          [icebreakerId],
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

  // Icebreaker 북마크 여부
  async isIcebreakerBookmarked(
    userId: number,
    icebreakerId: number,
  ): Promise<boolean> {
    const [row] = await this.bookmarkUserIcebreakerRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark_user_icebreaker` \
      WHERE userId = ? AND icebreakerId = ?',
      [userId, icebreakerId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크한 Icebreakers
  //? ----------------------------------------------------------------------- //

  // 내가 북마크한 Icebreakers (paginated)
  async listBookmarkedIcebreakers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Icebreaker>> {
    const queryBuilder = this.icebreakerRepository
      .createQueryBuilder('icebreaker')
      .innerJoinAndSelect(
        BookmarkUserIcebreaker,
        'bookmark_user_icebreaker',
        'bookmark_user_icebreaker.icebreakerId = icebreaker.id',
      )
      .innerJoinAndSelect('icebreaker.user', 'user')
      .where('bookmark_user_icebreaker.userId = :userId', { userId });

    const config: PaginateConfig<Icebreaker> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 Icebreakers
  async loadBookmarkedIcebreakers(userId: number): Promise<Icebreaker[]> {
    const queryBuilder =
      this.icebreakerRepository.createQueryBuilder('icebreaker');
    return await queryBuilder
      .innerJoinAndSelect(
        BookmarkUserIcebreaker,
        'bookmark_user_icebreaker',
        'bookmark_user_icebreaker.icebreakerId = icebreaker.id',
      )
      .addSelect(['icebreaker.*'])
      .where('bookmark_user_icebreaker.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 IcebreakerIds
  async loadBookmarkedIcebreakerIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserIcebreakerRepository.manager.query(
      'SELECT icebreakerId FROM `bookmark_user_icebreaker` \
      WHERE bookmark_user_icebreaker.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.icebreakerId);
  }

  //? ----------------------------------------------------------------------- //
  //? Icebreaker Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  // Icebreaker 신고 생성
  async createIcebreakerFlag(
    userId: number,
    icebreakerId: number,
    message: string,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({
          userId,
          entityType: 'icebreaker',
          entityId: icebreakerId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker` SET flagCount = flagCount + 1 WHERE id = ?',
        [icebreakerId],
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

  // Icebreaker 신고 제거
  async deleteIcebreakerFlag(
    userId: number,
    icebreakerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker`, icebreakerId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [icebreakerId],
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

  // Icebreaker 신고 여부
  async isIcebreakerFlagged(
    userId: number,
    icebreakerId: number,
  ): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `icebreaker`, icebreakerId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 신고한 Icebreakers
  //? ----------------------------------------------------------------------- //

  // 내가 신고한 Icebreakers (paginated)
  async listFlaggedIcebreakers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Icebreaker>> {
    const queryBuilder = this.icebreakerRepository
      .createQueryBuilder('icebreaker')
      .innerJoin(Flag, 'flag', 'icebreaker.id = flag.entityId')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', { entityType: 'icebreaker' });

    const config: PaginateConfig<Icebreaker> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Icebreakers
  async loadFlaggedIcebreakers(userId: number): Promise<Icebreaker[]> {
    const queryBuilder =
      this.icebreakerRepository.createQueryBuilder('icebreaker');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = icebreaker.id AND flag.entityType = :entityType',
        { entityType: 'icebreaker' },
      )
      .addSelect(['icebreaker.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 IcebreakerIds
  async loadFlaggedIcebreakerIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.entityType = ? AND flag.userId = ?',
      [`icebreaker`, userId],
    );

    return rows.map((v: any) => v.entityId);
  }
}
