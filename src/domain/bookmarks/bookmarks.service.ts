import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';

import { CreateBookmarkDto } from 'src/domain/bookmarks/dto/create-bookmark.dto';
import { UpdateBookmarkDto } from 'src/domain/bookmarks/dto/update-bookmark.dto';
import { Bookmark } from 'src/domain/bookmarks/entities/bookmark.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(
    // @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    // @Inject(RABBITMQ_CLIENT) private readonly rmqClient: ClientProxy,
    @InjectRepository(Bookmark)
    private readonly repository: Repository<Bookmark>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateBookmarkDto): Promise<Bookmark> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: dto.meetupId },
      relations: ['bookmarks'],
    });

    meetup.bookmarks.map((v: Bookmark) => {
      if (v.userId === dto.userId) {
        throw new BadRequestException('already bookmarked');
      }
    });

    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (e) {
      this.logger.error(e.message);
      throw new BadRequestException(e.message);
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Bookmark>> {
    return await paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        meetupId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
      relations: ['meetup'],
    });
  }

  async findAllWithMeetupId(
    meetupId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Bookmark>> {
    const queryBuilder = this.repository
      .createQueryBuilder('bookmark')
      .where({ meetupId });

    const config: PaginateConfig<Bookmark> = {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        meetupId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
      relations: ['meetup'],
    };
    return await paginate(query, queryBuilder, config);
  }

  async findById(id: string, relations: string[] = []): Promise<Bookmark> {
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
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
    const bookmark = await this.repository.preload({ id, ...dto });
    if (!bookmark) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(bookmark);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  // not being used.
  async softRemove(id: string): Promise<Bookmark> {
    const bookmark = await this.findById(id);
    return await this.repository.softRemove(bookmark);
  }

  async remove(id: string): Promise<Bookmark> {
    const bookmark = await this.findById(id);
    return await this.repository.remove(bookmark);
  }
}
