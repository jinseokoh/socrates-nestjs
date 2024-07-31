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
import { ConfigService } from '@nestjs/config';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UserHatesService {
  private readonly env: any;
  private readonly logger = new Logger(UserHatesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Hate)
    private readonly hateRepository: Repository<Hate>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? Hate Pivot (차단)
  //? ----------------------------------------------------------------------- //

  // 사용자 차단 추가
  async createUserHate(
    userId: number,
    recipientId: number,
    message: string | null,
  ): Promise<Hate> {
    try {
      const hate = await this.hateRepository.save(
        this.hateRepository.create({ userId, recipientId, message }),
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
  async deleteUserHate(userId: number, recipientId: number): Promise<void> {
    try {
      const { affectedRows } = await this.hateRepository.manager.query(
        'DELETE FROM `hate` WHERE userId = ? AND recipientId = ?',
        [userId, recipientId],
      );
      // return { data: affectedRows };
    } catch (error) {
      throw error;
    }
  }

  // 사용자 차단 여부
  async isHated(userId: number, recipientId: number): Promise<boolean> {
    try {
      const [row] = await this.hateRepository.manager.query(
        'SELECT COUNT(*) AS count FROM `hate` WHERE userId = ? AND recipientId = ?',
        [userId, recipientId],
      );
      const { count } = row;

      return +count === 1;
    } catch (error) {
      throw error;
    }
  }

  // 내가 차단한 Users (paginated)
  async listUsersBlockedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(Hate, 'hate', 'hate.recipientId = user.id')
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
  async loadAllUsersBlockedByMe(userId: number): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(Hate, 'hate', 'hate.recipient = user.id')
      .addSelect(['user.*'])
      .where('hate.userId = :userId', { userId })
      .getMany();
  }

  // 내가 차단하거나 나를 차단한 UserIds (all)
  async loadUserIdsEitherHatingOrBeingHated(userId: number): Promise<number[]> {
    const rows: { userId: number; recipientId: number }[] =
      await this.userRepository.manager.query(
        'SELECT userId, recipientId FROM `hate` WHERE userId = ? OR recipientId = ?',
        [userId, userId],
      );
    const data = rows.map((v: any) => {
      return v.userId === userId ? v.recipientId : v.userId;
    });

    return [...new Set(data)];
  }
}
