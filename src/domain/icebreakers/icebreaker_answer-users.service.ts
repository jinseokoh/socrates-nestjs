import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Repository } from 'typeorm';
import { User } from 'src/domain/users/entities/user.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Like } from 'src/domain/users/entities/like.entity';

@Injectable()
export class IcebreakerAnswerUsersService {
  private readonly logger = new Logger(IcebreakerAnswerUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 북마크 (Bookmark) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커 답변을 북마크/찜한 모든 Users
  async loadBookmarkers(icebreakerAnswerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Bookmark, 'bookmark', 'bookmark.userId = user.id')
      .addSelect(['user.*'])
      .where('bookmark.entityId = :icebreakerAnswerId', {
        icebreakerAnswerId,
      })
      .andWhere('bookmark.entityType = :entityType', {
        entityType: 'icebreaker_answer',
      })
      .getMany();
  }

  // 이 아이스브레이커 답변을 북마크/찜한 모든 UserIds
  async loadBookmarkerIds(icebreakerAnswerId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `bookmark` \
      WHERE bookmark.entityType = ? AND bookmark.entityId = ?',
      [`icebreaker_answer`, icebreakerAnswerId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.userId) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? 좋아요 (Like) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커 답변을 좋아요한 모든 Users
  async loadLikers(icebreakerAnswerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Like, 'like', 'like.userId = user.id')
      .addSelect(['user.*'])
      .where('like.entityId = :icebreakerAnswerId', {
        icebreakerAnswerId,
      })
      .andWhere('like.entityType = :entityType', {
        entityType: 'icebreaker_answer',
      })
      .getMany();
  }

  // 이 아이스브레이커 답변을 좋아요한 모든 UserIds
  async loadLikerIds(icebreakerAnswerId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `like` \
      WHERE like.entityType = ? AND like.entityId = ?',
      [`icebreaker_answer`, icebreakerAnswerId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.userId) : [];
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커 답변을 신고한 모든 Users (all)
  async loadIcebreakerFlaggingUsers(
    icebreakerAnswerId: number,
  ): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .leftJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where('flag.entityId = :icebreakerAnswerId', {
        icebreakerAnswerId,
      })
      .andWhere('flag.entityType = :entityType', {
        entityType: 'icebreaker_answer',
      })
      .getMany();
  }

  // 이 아이스브레이커 답변을 신고한 모든 UserIds (all)
  async loadIcebreakerFlaggingUserIds(
    icebreakerAnswerId: number,
  ): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = ? AND flag.entityId = ?',
      [`icebreaker_answer`, icebreakerAnswerId],
    );

    return rows.length > 0 ? rows.map((v: any) => v.userId) : [];
  }
}
