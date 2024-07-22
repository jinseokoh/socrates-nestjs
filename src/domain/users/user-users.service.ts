import { Flag } from 'src/domain/users/entities/flag.entity';
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
import { AnyData } from 'src/common/types';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UserUsersService {
  private readonly env: any;
  private readonly logger = new Logger(UserUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Hate)
    private readonly hateRepository: Repository<Hate>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //! ------------------------------------------------------------------------//
  //! Hate Pivot (차단)
  //! ------------------------------------------------------------------------//

  // 사용자 차단 추가
  async createHate(
    userId: number,
    targetUserId: number,
    message: string | null,
  ): Promise<Hate> {
    try {
      const hate = await this.hateRepository.save(
        this.hateRepository.create({ userId, targetUserId, message }),
      );
      return hate;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    }
  }

  // 사용자 차단 삭제
  async deleteHate(userId: number, targetUserId: number): Promise<any> {
    try {
      const { affectedRows } = await this.hateRepository.manager.query(
        'DELETE FROM `hate` WHERE userId = ? AND targetUserId = ?',
        [userId, targetUserId],
      );
      return { data: affectedRows };
    } catch (error) {
      throw error;
    }
  }

  // 사용자 차단 여부
  async isHated(userId: number, targetUserId: number): Promise<boolean> {
    try {
      const [row] = await this.hateRepository.manager.query(
        'SELECT COUNT(*) AS count FROM `hate` WHERE userId = ? AND targetUserId = ?',
        [userId, targetUserId],
      );
      const { count } = row;

      return +count === 1;
    } catch (error) {
      throw error;
    }
  }

  // 내가 차단한 Users (paginated)
  async findBlockedUsers(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(Hate, 'hate', 'hate.targetUserId = user.id')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('hate.userId = :userId', { userId });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      searchableColumns: ['username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 차단한 Users (all)
  async loadBlockedUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Hate, 'hate', 'hate.targetUserId = user.id')
      .addSelect(['user.*'])
      .where('hate.userId = :userId', { userId })
      .getMany();
  }

  // 내가 차단하거나 나를 차단한 UserIds (all)
  async loadUserIdsEitherHatingOrBeingHated(userId: number): Promise<number[]> {
    const rows: { userId: number; targetUserId: number }[] =
      await this.userRepository.manager.query(
        'SELECT userId, targetUserId FROM `hate` WHERE userId = ? OR targetUserId = ?',
        [userId, userId],
      );
    const data = rows.map((v: any) => {
      return v.userId === userId ? v.targetUserId : v.userId;
    });

    return [...new Set(data)];
  }
}
