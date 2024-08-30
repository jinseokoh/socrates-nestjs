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
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { Like } from 'src/domain/users/entities/like.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Repository } from 'typeorm/repository/Repository';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserIcebreakerAnswersService {
  private readonly env: any;
  private readonly logger = new Logger(UserIcebreakerAnswersService.name);

  constructor(
    @InjectRepository(IcebreakerAnswer)
    private readonly icebreakerAnswerRepository: Repository<IcebreakerAnswer>,
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
  //? My Icebreaker Answers
  //? ----------------------------------------------------------------------- //

  // 내가 쓴 답변 리스트
  async findMyIcebreakerAnswers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('icebreakerAnswer')
      .leftJoinAndSelect('icebreakerAnswer.icebreaker', 'icebreaker')
      .where('icebreakerAnswer.userId = :userId', {
        userId,
      });

    const config: PaginateConfig<IcebreakerAnswer> = {
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
  async loadMyIcebreakerAnswers(userId: number): Promise<IcebreakerAnswer[]> {
    return await this.icebreakerAnswerRepository
      .createQueryBuilder('icebreakerAnswer')
      .innerJoinAndSelect('icebreakerAnswer.icebreaker', 'icebreaker')
      .where({
        userId,
      })
      .getMany();
  }

  // 내가 만든 Icebreaker Ids 리스트 (all)
  async loadMyIcebreakerAnswerIds(userId: number): Promise<number[]> {
    const rows = await this.icebreakerAnswerRepository
      .createQueryBuilder('icebreakerAnswer')
      .where({
        userId,
      })
      .getMany();

    return rows.length > 0 ? rows.map((v: any) => v.id) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  async createIcebreakerAnswerBookmark(
    userId: number,
    icebreakerAnswerId: number,
  ): Promise<Bookmark> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Bookmark).create({
          userId,
          entityType: 'icebreaker_answer',
          entityId: icebreakerAnswerId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker_answer` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [icebreakerAnswerId],
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

  async deleteIcebreakerAnswerBookmark(
    userId: number,
    icebreakerAnswerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark` WHERE userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker_answer`, icebreakerAnswerId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker_answer` SET bookmarkCount = bookmarkCount - 1 WHERE id = ? AND bookmarkCount > 0',
          [icebreakerAnswerId],
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
  async isIcebreakerAnswerBookmarked(
    userId: number,
    icebreakerId: number,
  ): Promise<boolean> {
    const [row] = await this.bookmarkRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `icebreaker_answer`, icebreakerId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 북마크한 IcebreakerAnswers (paginated)
  async listBookmarkedIcebreakerAnswers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('icebreakerAnswer')
      .innerJoin(
        Bookmark,
        'bookmark',
        'bookmark.entityId = icebreakerAnswer.id',
      )
      .leftJoinAndSelect('icebreakerAnswer.user', 'user')
      .leftJoinAndSelect('icebreakerAnswer.icebreaker', 'icebreaker')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('bookmark.entityType = :entityType', {
        entityType: 'icebreaker_answer',
      });

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 IcebreakerAnswers
  async loadBookmarkedIcebreakerAnswers(
    userId: number,
  ): Promise<IcebreakerAnswer[]> {
    const queryBuilder =
      this.icebreakerAnswerRepository.createQueryBuilder('icebreakerAnswer');
    return await queryBuilder
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.entityId = icebreakerAnswer.id AND bookmark.entityType = :entityType',
        { entityType: 'icebreaker_answer' },
      )
      .addSelect(['icebreakerAnswer.*'])
      .where('bookmark.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 IcebreakerAnswerIds
  async loadBookmarkedIcebreakerAnswerIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkRepository.manager.query(
      'SELECT entityId FROM `bookmark` \
      WHERE bookmark.entityType = ? AND bookmark.userId = ?',
      [`icebreaker_answer`, userId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.entityId) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? IcebreakerAnswer Like 좋아요 생성
  //? ----------------------------------------------------------------------- //

  // IcebreakerAnswer 좋아요 생성
  async createIcebreakerAnswerLike(
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
          entityType: 'icebreaker_answer',
          entityId: icebreakerId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker_answer` SET likeCount = likeCount + 1 WHERE id = ?',
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

  // IcebreakerAnswer 좋아요 제거
  async deleteIcebreakerAnswerLike(
    userId: number,
    icebreakerAnswerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `like` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker_answer`, icebreakerAnswerId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker_answer` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
          [icebreakerAnswerId],
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

  // IcebreakerAnswer 좋아요 여부
  async isIcebreakerAnswerLiked(
    userId: number,
    icebreakerId: number,
  ): Promise<boolean> {
    const [row] = await this.likeRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `like` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `icebreaker_answer`, icebreakerId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 좋아요한 IcebreakerAnswers (paginated)
  async listLikedIcebreakerAnswers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('icebreakerAnswer')
      .innerJoin(Like, 'like', 'like.entityId = icebreakerAnswer.id')
      .leftJoinAndSelect('icebreakerAnswer.user', 'user')
      .leftJoinAndSelect('icebreakerAnswer.icebreaker', 'icebreaker')
      .where('like.userId = :userId', { userId })
      .andWhere('like.entityType = :entityType', {
        entityType: 'icebreaker_answer',
      });

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 좋아요한 모든 IcebreakerAnswers
  async loadLikedIcebreakerAnswers(
    userId: number,
  ): Promise<IcebreakerAnswer[]> {
    const queryBuilder =
      this.icebreakerAnswerRepository.createQueryBuilder('icebreakerAnswer');
    return await queryBuilder
      .innerJoinAndSelect(
        Like,
        'like',
        'like.entityId = icebreakerAnswer.id AND like.entityType = :entityType',
        { entityType: 'icebreaker_answer' },
      )
      .addSelect(['icebreakerAnswer.*'])
      .where('like.userId = :userId', { userId })
      .getMany();
  }

  // 내가 좋아요한 모든 IcebreakerAnswerIds
  async loadLikedIcebreakerAnswerIds(userId: number): Promise<number[]> {
    const rows = await this.likeRepository.manager.query(
      'SELECT entityId FROM `like` \
      WHERE like.entityType = ? AND like.userId = ?',
      [`icebreaker_answer`, userId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.entityId) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? IcebreakerAnswer Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  // IcebreakerAnswer 신고 생성
  async createIcebreakerAnswerFlag(
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
          entityType: 'icebreaker_answer',
          entityId: icebreakerId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker_answer` SET flagCount = flagCount + 1 WHERE id = ?',
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

  // IcebreakerAnswer 신고 제거
  async deleteIcebreakerAnswerFlag(
    userId: number,
    icebreakerAnswerId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker_answer`, icebreakerAnswerId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker_answer` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [icebreakerAnswerId],
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

  // IcebreakerAnswer 신고 여부
  async isIcebreakerAnswerFlagged(
    userId: number,
    icebreakerId: number,
  ): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `icebreaker_answer`, icebreakerId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 신고한 IcebreakerAnswers (paginated)
  async listFlaggedIcebreakerAnswers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('icebreakerAnswer')
      .innerJoin(Flag, 'flag', 'flag.entityId = icebreakerAnswer.id')
      .leftJoinAndSelect('icebreakerAnswer.user', 'user')
      .leftJoinAndSelect('icebreakerAnswer.icebreaker', 'icebreaker')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', {
        entityType: 'icebreaker_answer',
      });

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 IcebreakerAnswers
  async loadFlaggedIcebreakerAnswers(
    userId: number,
  ): Promise<IcebreakerAnswer[]> {
    const queryBuilder =
      this.icebreakerAnswerRepository.createQueryBuilder('icebreakerAnswer');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = icebreakerAnswer.id AND flag.entityType = :entityType',
        { entityType: 'icebreaker_answer' },
      )
      .addSelect(['icebreakerAnswer.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 IcebreakerIds
  async loadFlaggedIcebreakerAnswerIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.entityType = ? AND flag.userId = ?',
      [`icebreaker_answer`, userId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.entityId) : [];
  }
}
