import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Follow } from 'src/domain/follows/follow.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly repository: Repository<Follow>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async find(myUserId: number, otherUserId: number) {
    return await this.repository.findOne({
      followerId: myUserId,
      followingId: otherUserId,
    });
  }

  async follow(myUserId: number, otherUserId: number) {
    const follow = await this.find(myUserId, otherUserId);
    if (follow) {
      throw new BadRequestException(`relationship already exists`);
    }

    const newFollow = this.repository.create({
      followerId: myUserId,
      followingId: otherUserId,
    });

    return await this.repository.save(newFollow);
  }

  async findAllFollowersUsingFollow(
    myUserId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Follow>> {
    const queryBuilder = this.repository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.follower', 'followers')
      .where('follow.followingId = :id', { id: myUserId });

    const config: PaginateConfig<Follow> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<Follow>(query, queryBuilder, config);
  }

  async findAllFollowingsUsingFollow(
    myUserId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Follow>> {
    const queryBuilder = this.repository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.following', 'following')
      .where('follow.followerId = :id', { id: myUserId });
    const config: PaginateConfig<Follow> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<Follow>(query, queryBuilder, config);
  }

  async findAllFollowers(
    myUserId: number,
    query: PaginateQuery,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('follow', 'f', 'user.id = f.FollowerId')
      .where('f.FollowingId = :id', { id: myUserId });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<User>(query, queryBuilder, config);
  }

  async findAllFollowings(
    myUserId: number,
    query: PaginateQuery,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('follow', 'f', 'user.id = f.FollowingId')
      .where('f.FollowerId = :id', { id: myUserId });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<User>(query, queryBuilder, config);
  }

  async unfollow(myUserId: number, otherUserId: number): Promise<Follow> {
    const follow = await this.find(myUserId, otherUserId);
    if (!follow) {
      throw new NotFoundException(`relationship not found`);
    }

    return await this.repository.remove(follow);
  }
}
