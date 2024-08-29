import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';

@Injectable()
export class IcebreakerUsersService {
  private readonly env: any;
  private readonly logger = new Logger(IcebreakerUsersService.name);

  constructor(
    @InjectRepository(Icebreaker)
    private readonly icebreakerRepository: Repository<Icebreaker>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크 (Bookmark) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커을 북마크/찜한 모든 Users
  async loadBookmarkers(icebreakerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.userId = user.id',
      )
      .addSelect(['user.*'])
      .where('bookmark.icebreakerId = :icebreakerId', {
        icebreakerId,
      })
      .getMany();
  }

  // 이 아이스브레이커을 북마크/찜한 모든 UserIds
  async loadBookmarkerIds(icebreakerId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `bookmark` \
      WHERE bookmark.icebreakerId = ?',
      [icebreakerId],
    );

    return rows.map((v: any) => v.userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 아이스브레이커을 신고한 모든 Users (all)
  async loadIcebreakerFlaggingUsers(icebreakerId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .leftJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where(
        'flag.entityType = :entityType AND flag.entityId = :icebreakerId',
        {
          entityType: `icebreaker`,
          icebreakerId,
        },
      )
      .getMany();
  }

  // 이 아이스브레이커을 신고한 모든 UserIds (all)
  async loadIcebreakerFlaggingUserIds(icebreakerId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = ? AND flag.entityId = ?',
      [`icebreaker`, icebreakerId],
    );

    return rows.map((v: any) => v.userId);
  }
}
