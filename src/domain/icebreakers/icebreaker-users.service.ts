import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Like } from 'src/domain/users/entities/like.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';

@Injectable()
export class IcebreakerUsersService {
  private readonly env: any;
  private readonly logger = new Logger(IcebreakerUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크 (Bookmark) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커를 북마크/찜한 모든 Users
  async loadBookmarkers(icebreakerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Bookmark, 'bookmark', 'bookmark.userId = user.id')
      .addSelect(['user.*'])
      .where('bookmark.entityId = :icebreakerId', {
        icebreakerId,
      })
      .andWhere('bookmark.entityType = :entityType', {
        entityType: 'icebreaker',
      })
      .getMany();
  }

  // 이 아이스브레이커를 북마크/찜한 모든 UserIds
  async loadBookmarkerIds(icebreakerId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `bookmark` \
      WHERE bookmark.entityType = ? AND bookmark.entityId = ?',
      [`icebreaker`, icebreakerId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.userId) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? 좋아요 (Like) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커를 좋아요한 모든 Users
  async loadLikers(icebreakerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Like, 'like', 'like.userId = user.id')
      .addSelect(['user.*'])
      .where('like.entityId = :icebreakerId', {
        icebreakerId,
      })
      .andWhere('like.entityType = :entityType', {
        entityType: 'icebreaker',
      })
      .getMany();
  }

  // 이 아이스브레이커를 좋아요한 모든 UserIds
  async loadLikerIds(icebreakerId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `like` \
      WHERE like.entityType = ? AND like.entityId = ?',
      [`icebreaker`, icebreakerId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.userId) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커를 신고한 모든 Users (all)
  async loadIcebreakerFlaggingUsers(icebreakerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .leftJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where('flag.entityId = :icebreakerId', {
        icebreakerId,
      })
      .andWhere('flag.entityType = :entityType', {
        entityType: 'icebreaker',
      })
      .getMany();
  }

  // 이 아이스브레이커를 신고한 모든 UserIds (all)
  async loadIcebreakerFlaggingUserIds(icebreakerId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = ? AND flag.entityId = ?',
      [`icebreaker`, icebreakerId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.userId) : [];
  }
}
