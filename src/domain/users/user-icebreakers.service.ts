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
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { DataSource } from 'typeorm';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Like } from 'src/domain/users/entities/like.entity';

@Injectable()
export class UserIcebreakersService {
  private readonly env: any;
  private readonly logger = new Logger(UserIcebreakersService.name);

  constructor(
    @InjectRepository(Icebreaker)
    private readonly icebreakerRepository: Repository<Icebreaker>,
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
  //? My Icebreakers
  //? ----------------------------------------------------------------------- //

  // 내가 쓴 질문 리스트
  async findMyIcebreakers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Icebreaker>> {
    const queryBuilder = this.icebreakerRepository
      .createQueryBuilder('icebreaker')
      .leftJoinAndSelect('icebreaker.answers', 'answers')
      .leftJoinAndSelect('icebreaker.user', 'user')
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
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  async createIcebreakerBookmark(
    userId: number,
    icebreakerId: number,
  ): Promise<Bookmark> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Bookmark).create({
          userId,
          entityType: 'icebreaker',
          entityId: icebreakerId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [icebreakerId],
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

  async deleteIcebreakerBookmark(
    userId: number,
    icebreakerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark` WHERE userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker`, icebreakerId],
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
    const [row] = await this.bookmarkRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `icebreaker`, icebreakerId],
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
        Bookmark,
        'bookmark',
        'bookmark.entityId = icebreaker.id',
      )
      .innerJoinAndSelect('icebreaker.user', 'user')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('bookmark.entityType = :entityType', {
        entityType: 'icebreaker',
      });

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
        Bookmark,
        'bookmark',
        'bookmark.entityId = icebreaker.id AND bookmark.entityType = :entityType',
        { entityType: 'icebreaker' },
      )
      .addSelect(['icebreaker.*'])
      .where('bookmark.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 IcebreakerIds
  async loadBookmarkedIcebreakerIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkRepository.manager.query(
      'SELECT icebreakerId FROM `bookmark` \
      WHERE bookmark.entityType = ? AND bookmark.userId = ?',
      [`icebreaker`, userId],
    );

    return rows.map((v: any) => v.icebreakerId);
  }

  //? ----------------------------------------------------------------------- //
  //? Icebreaker Like 신고 생성
  //? ----------------------------------------------------------------------- //

  // Icebreaker 신고 생성
  async createIcebreakerLike(
    userId: number,
    icebreakerId: number,
  ): Promise<Like> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const like = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Like).create({
          userId,
          entityType: 'icebreaker',
          entityId: icebreakerId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker` SET likeCount = likeCount + 1 WHERE id = ?',
        [icebreakerId],
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

  // Icebreaker 신고 제거
  async deleteIcebreakerLike(
    userId: number,
    icebreakerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `like` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker`, icebreakerId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
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

  // Icebreaker 신고 여부
  async isIcebreakerLiked(
    userId: number,
    icebreakerId: number,
  ): Promise<boolean> {
    const [row] = await this.likeRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `like` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `icebreaker`, icebreakerId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 좋아요한 Icebreakers
  //? ----------------------------------------------------------------------- //

  // 내가 좋아요한 Icebreakers (paginated)
  async listLikedIcebreakers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Icebreaker>> {
    const queryBuilder = this.icebreakerRepository
      .createQueryBuilder('icebreaker')
      .innerJoin(Like, 'like', 'like.entityId = icebreaker.id')
      .where('like.userId = :userId', { userId })
      .andWhere('like.entityType = :entityType', { entityType: 'icebreaker' });

    const config: PaginateConfig<Icebreaker> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 좋아요한 모든 Icebreakers
  async loadLikedIcebreakers(userId: number): Promise<Icebreaker[]> {
    const queryBuilder =
      this.icebreakerRepository.createQueryBuilder('icebreaker');
    return await queryBuilder
      .innerJoinAndSelect(
        Like,
        'like',
        'like.entityId = icebreaker.id AND like.entityType = :entityType',
        { entityType: 'icebreaker' },
      )
      .addSelect(['icebreaker.*'])
      .where('like.userId = :userId', { userId })
      .getMany();
  }

  // 내가 좋아요한 모든 IcebreakerIds
  async loadLikedIcebreakerIds(userId: number): Promise<number[]> {
    const rows = await this.likeRepository.manager.query(
      'SELECT entityId FROM `like` \
      WHERE like.entityType = ? AND like.userId = ?',
      [`icebreaker`, userId],
    );

    return rows.map((v: any) => v.entityId);
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
      await queryRunner.commitTransaction();
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
