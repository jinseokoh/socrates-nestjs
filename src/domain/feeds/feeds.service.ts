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
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateFeedDto } from 'src/domain/feeds/dto/update-feed.dto';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    private eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateFeedDto): Promise<Feed> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const poll = dto.poll
        ? await queryRunner.manager.getRepository(Poll).save(
            new Poll({
              slug: dto.poll.slug,
              question: dto.poll.question,
              options: dto.poll.options,
              isMultiple: dto.poll.isMultiple,
              userId: dto.userId,
            }),
          )
        : null;
      const feed = await queryRunner.manager.getRepository(Feed).save(
        new Feed({
          slug: dto.slug,
          title: dto.title,
          body: dto.body,
          images: dto.images,
          isAnonymous: dto.isAnonymous,
          userId: dto.userId,
          polls: [poll],
        }),
      );
      return feed;
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? Read
  //? ----------------------------------------------------------------------- //

  // 전체 feed 리스트 (paginated)
  async findAll(query: PaginateQuery): Promise<Paginated<Feed>> {
    return await paginate(query, this.feedRepository, {
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

  // Feed 상세보기
  async findById(id: number, relations: string[] = []): Promise<Feed> {
    try {
      return relations.length > 0
        ? await this.feedRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.feedRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? Update
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateFeedDto): Promise<Feed> {
    const feed = await this.feedRepository.preload({ id, ...dto });
    if (!feed) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.feedRepository.save(feed);
  }

  async increaseViewCount(id: number): Promise<void> {
    await this.feedRepository
      .createQueryBuilder()
      .update(Feed)
      .where('id = :id', { id })
      .set({ viewCount: () => 'viewCount + 1' })
      .execute();
  }

  //? ----------------------------------------------------------------------- //
  //? Delete
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<Feed> {
    const feed = await this.findById(id);
    return await this.feedRepository.softRemove(feed);
  }

  async remove(id: number): Promise<Feed> {
    const feed = await this.findById(id);
    return await this.feedRepository.remove(feed);
  }

  //? ----------------------------------------------------------------------- //
  //? Upload
  //? ----------------------------------------------------------------------- //

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
