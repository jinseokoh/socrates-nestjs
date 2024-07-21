import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { CreatePleaDto } from 'src/domain/pleas/dto/create-plea.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';

@Injectable()
export class UsersFeedService {
  private readonly env: any;
  private readonly logger = new Logger(UsersFeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(BookmarkUserFeed)
    private readonly bookmarkUserFeedRepository: Repository<BookmarkUserFeed>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Feeds
  //?-------------------------------------------------------------------------//


  // 이 회원의 Feed 리스트 전부 보기
  async loadMyFeeds(userId: number): Promise<Feed[]> {
    try {
      return this.feedRepository
        .createQueryBuilder('feed')
        .leftJoinAndSelect('feed.poll', 'poll')
        .leftJoinAndSelect('feed.user', 'author')
        .leftJoinAndSelect('feed.comments', 'comment')
        .leftJoinAndSelect('comment.user', 'user')
        .where({
          userId,
        })
        .getMany();
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? Plea Pivot
  //?-------------------------------------------------------------------------//

  // 발견요청 리스트에 추가
  async attachToPleaPivot(dto: CreatePleaDto): Promise<Plea> {
    const plea = await this.pleaRepository.save(
      this.pleaRepository.create(dto),
    );

    return plea;
  }

  async getUniqueUsersPleaded(userId: number): Promise<User[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .where({
        askedUserId: userId,
      })
      .groupBy('plea.senderId')
      .getMany();

    return items.map((v) => v.sender);
  }
}
