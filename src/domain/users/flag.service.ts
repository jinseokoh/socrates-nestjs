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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnyData } from 'src/common/types';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';

@Injectable()
export class FlagService {
  private readonly env: any;
  private readonly logger = new Logger(FlagService.name);

  constructor(
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? 댓글 생성
  //?-------------------------------------------------------------------------//

  // 댓글 신고 리스트에 추가 및 관련 모델의 flagCount 증가
  async createFlag(userId: number, dto: CreateFlagDto): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({ ...dto, userId }),
      );

      switch (dto.entityType) {
        case `feed`:
          await queryRunner.manager.query(
            'UPDATE `feed` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
        case `meetup`:
          await queryRunner.manager.query(
            'UPDATE `meetup` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
        case `comment`:
          await queryRunner.manager.query(
            'UPDATE `comment` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
        case `thread`:
          await queryRunner.manager.query(
            'UPDATE `thread` SET flagCount = flagCount + 1 WHERE id = ?',
            [dto.entityId],
          );
          break;
      }
      await queryRunner.commitTransaction();
      return flag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      if (error.code === 'ER_DUP_ENTRY') {
        // plea already exists
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // 나의 북마크에서 feed 제거
  async deleteFlag(userId: number, dto: CreateFlagDto): Promise<AnyData> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, dto.entityType, dto.entityId],
      );
      if (affectedRows > 0) {
        switch (dto.entityType) {
          case `feed`:
            await queryRunner.manager.query(
              'UPDATE `feed` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
          case `meetup`:
            await queryRunner.manager.query(
              'UPDATE `meetup` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
          case `comment`:
            await queryRunner.manager.query(
              'UPDATE `comment` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
          case `thread`:
            await queryRunner.manager.query(
              'UPDATE `thread` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
              [dto.entityId],
            );
            break;
        }
      }
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 내가 북마크한 entity 리스트 (paginated)
  async getFlagsByUserId(
    query: PaginateQuery,
    userId: number,
    entityType = null,
  ): Promise<Paginated<Flag>> {
    let queryBuilder;
    switch (entityType) {
      case `feed`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Feed,
            'feed',
            'feed.id = flag.entityId AND flag.entityType = :entityType',
            { entityType: 'feed' },
          )
          .innerJoinAndSelect('feed.user', 'user')
          .where({
            userId: userId,
          });
        break;
      case `meetup`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Meetup,
            'meetup',
            'meetup.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .innerJoinAndSelect('meetup.user', 'user')
          .where({
            userId: userId,
          });
        break;
      case `comment`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Comment,
            'comment',
            'comment.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .innerJoinAndSelect('comment.user', 'user')
          .where({
            userId: userId,
          });
        break;
      case `thread`:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Thread,
            'thread',
            'thread.id = flag.entityId AND flag.entityType = :entityType',
            { entityType },
          )
          .innerJoinAndSelect('thread.user', 'user')
          .where({
            userId: userId,
          });
        break;
      default:
        queryBuilder = this.flagRepository
          .createQueryBuilder('flag')
          .innerJoinAndSelect(
            Meetup,
            'meetup',
            'meetup.id = flag.entityId AND flag.entityType = :entityType',
            { entityType: 'meetup' },
          )
          .where({
            userId: userId,
          });
        break;
    }

    const config: PaginateConfig<Flag> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // // 내가 북마크한 모든 feedIds
  // async getAllIdsReportedByMe(userId: number): Promise<number[]> {
  //   const rows = await this.flagRepository.manager.query(
  //     'SELECT userId, feedId \
  //     FROM `flag` \
  //     WHERE userId = ?',
  //     [userId],
  //   );

  //   return rows.map((v: Flag) => v.feedId);
  // }

  // 내가 북마크한 feed 여부
  async isReported(
    userId: number,
    entityType: string,
    entityId: number,
  ): Promise<AnyData> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, entityType, entityId],
    );
    const { count } = row;

    return { data: +count };
  }
}
