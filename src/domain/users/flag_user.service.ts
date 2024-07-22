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
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class FlagUserService {
  private readonly env: any;
  private readonly logger = new Logger(FlagUserService.name);

  constructor(
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ------------------------------------------------------------------------//
  //? User
  //? ------------------------------------------------------------------------//

  // User 신고 생성
  // 가능하다면, user flagCount 증가
  async createUserFlag(
    userId: number,
    targetUserId: number,
    message: string,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({
          userId,
          entityType: 'user',
          entityId: targetUserId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `profile` SET flagCount = flagCount + 1 WHERE userId = ?',
        [targetUserId],
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

  // User 신고 제거
  // 가능하다면, user flagCount 감소
  async deleteUserFlag(userId: number, targetUserId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `user`, targetUserId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `profile` SET flagCount = flagCount - 1 WHERE userId = ? AND flagCount > 0',
          [targetUserId],
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

  // User 신고 여부
  async isUserFlagged(userId: number, targetUserId: number): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `user`, targetUserId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 신고한 Users (paginated)
  async findFlaggedUsers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(Flag, 'flag', 'flag.entityId = user.id')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', { entityType: 'user' });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      searchableColumns: ['username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Users
  async loadFlaggedUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = user.id AND flag.entityType = :entityType',
        { entityType: 'user' },
      )
      .addSelect(['user.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 UserIds
  async loadFlaggedUserIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.userId = ? AND flag.entityType = ?',
      [userId, 'user'],
    );

    return rows.map((v: any) => v.entityId);
  }

  //? 새롭게 추가 -----------------------------------------------------------------//

  // 나를 신고한 모든 Users
  async loadUserFlaggingUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = user.id AND flag.entityType = :entityType',
        { entityType: 'user' },
      )
      .addSelect(['user.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 나를 신고한 모든 UserIds
  async loadUserFlaggingUserIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.userId = ? AND flag.entityType = ?',
      [userId, 'user'],
    );

    return rows.map((v: any) => v.entityId);
  }
}
