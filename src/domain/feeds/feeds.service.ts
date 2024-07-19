import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateFeedDto } from 'src/domain/feeds/dto/create-feed.dto';
import { LoremIpsum } from 'lorem-ipsum';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateFeedDto } from 'src/domain/feeds/dto/update-feed.dto';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { RequestFrom } from 'src/common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { FeedFeedLink } from 'src/domain/feeds/entities/feed_feed_link.entity';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly repository: Repository<Feed>,
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    @InjectRepository(FeedFeedLink)
    private readonly feedFeedLinkRepository: Repository<FeedFeedLink>,
    private eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateFeedDto): Promise<Feed> {
    try {
      const feed = await this.repository.save(this.repository.create(dto));
      if (dto.linkedFeedIds && dto.linkedFeedIds.length > 0) {
        await Promise.all(
          dto.linkedFeedIds.map(async (v: number) => {
            const bookmark = this.feedFeedLinkRepository.create({
              feed: { id: feed.id },
              linkedFeed: { id: v },
            });
            return await this.feedFeedLinkRepository.save(bookmark);
          }),
        );
      }
      return feed;
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  async findAll(query: PaginateQuery): Promise<Paginated<Feed>> {
    return await paginate(query, this.repository, {
      relations: ['user'],
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        pollId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        uneasyCount: [FilterOperator.LT, FilterOperator.GT],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'poll.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Feed> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateFeedDto): Promise<Feed> {
    const feed = await this.repository.preload({ id, ...dto });
    if (!feed) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(feed);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'feed', dto.mimeType);
    const path = `${process.env.NODE_ENV}/feeds/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
