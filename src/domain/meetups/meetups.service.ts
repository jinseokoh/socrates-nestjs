import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { AnyData, SignedUrl } from 'src/common/types';
import { Career } from 'src/domain/careers/entities/career.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { In } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Room } from 'src/domain/chats/entities/room.entity';
@Injectable()
export class MeetupsService {
  private readonly logger = new Logger(MeetupsService.name);

  constructor(
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    @InjectRepository(Meetup)
    private readonly repository: Repository<Meetup>,
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Thread)
    private readonly threadRepository: Repository<Thread>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // Meetup 생성
  async create(dto: CreateMeetupDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: {
        id: dto.userId,
      },
    });
    if (!user || user?.isBanned) {
      throw new BadRequestException(`not allowed to create`);
    }

    //? 1) create model and the relationship
    const _meetup = this.repository.create(dto);
    const categories = await this._getCategoriesBySlug(dto.subCategory);
    const careers = await this._getCareersBySlugs(dto.targetCareers);
    let venue = await this.venueRepository.findOne({
      where: {
        providerId: dto.venue.providerId,
      },
    });
    if (!venue) {
      venue = await this.venueRepository.save(
        this.venueRepository.create(dto.venue),
      );
    }
    _meetup.categories = categories;
    _meetup.careers = careers;
    _meetup.venue = venue;
    const meetup = await this.repository.save(_meetup);

    //? 2) insert a new room record
    await this.repository.manager.query(
      'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
      ['host', dto.userId, meetup.id],
    );

    //? 3) update user's interests
    const category = await this.categoryRepository.findOneBy({
      slug: dto.subCategory,
    });
    if (category !== null) {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `interest` \
  (userId, categoryId, skill) VALUES (?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  categoryId = VALUES(`categoryId`), \
  skill = VALUES(`skill`)',
        [dto.userId, category.id, dto.skill],
      );
    }

    return meetup;
  }

  //--------------------------------------------------------------------------//
  // set relations
  //--------------------------------------------------------------------------//

  async _getCategoriesBySlug(slug: string): Promise<Category[]> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });
    const categories = await this.repository.manager
      .getTreeRepository(Category)
      .findAncestors(category);
    return categories
      .filter((v: Category) => v.depth > 0) // remove root
      .map((v: Category) => v);
  }

  async _getCareersBySlugs(slugs: string[]): Promise<Career[]> {
    return await this.careerRepository.find({
      where: { slug: In(slugs) },
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Meetup 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Meetup>> {
    const queryBuilder = this.repository
      .createQueryBuilder('meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<Meetup> = {
      relations: {
        user: { profile: true },
        careers: true, // needed for filtering
      },
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.EQ, FilterOperator.IN],
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        targetCareers: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        'careers.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Meetup 리스트 w/ Pagination
  async fetchRoomsByMeetupId(id: number): Promise<Room[]> {
    const meetup = await this.repository.findOneOrFail({
      where: { id },
      relations: ['rooms', 'rooms.user', 'rooms.user.profile'],
    });

    return meetup.rooms;
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Meetup> {
    try {
      await this.increaseViewCount(id);
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
            order: {
              threads: {
                id: 'DESC',
              },
            },
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

  async update(id: number, dto: UpdateMeetupDto): Promise<Meetup> {
    const meetup = await this.repository.preload({ id, ...dto });
    if (!meetup) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(meetup);
  }

  async increaseViewCount(id: number): Promise<void> {
    // in case you need to return the increased viewCount, use:
    //
    // const meetup = await this.findById(id);
    // const count = meetup.viewCount + 1;
    // meetup.viewCount = count;
    // await this.repository.save(meetup);
    // return count;
    //
    // otherwise, it's better to use the followings, which is atomic
    //
    await this.repository
      .createQueryBuilder()
      .update(Meetup)
      .where('id = :id', { id })
      .set({ viewCount: () => 'viewCount + 1' })
      .execute();
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Meetup> {
    const Meetup = await this.findById(id);
    return await this.repository.softRemove(Meetup);
  }

  async remove(id: number): Promise<Meetup> {
    const Meetup = await this.findById(id);
    return await this.repository.remove(Meetup);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // 단일 이미지 저장후 URL (string) 리턴
  // todo. remove anydata from services
  async uploadImage(
    userId: number,
    file: Express.Multer.File,
  ): Promise<AnyData> {
    const path = `${process.env.NODE_ENV}/files/${userId}/${randomName(
      'meetup',
      file.mimetype,
    )}`;
    await this.s3Service.upload(file.buffer, path);

    return { data: `${process.env.AWS_CLOUDFRONT_URL}/${path}` };
  }

  // 다중 이미지 저장후 URL (string) 리턴
  // todo. remove anydata from services
  async uploadImages(
    userId: number,
    files: Array<Express.Multer.File>,
  ): Promise<AnyData> {
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${process.env.NODE_ENV}/files/${userId}/${randomName(
        'meetup',
        file.mimetype,
      )}`;
      await this.s3Service.upload(file.buffer, path);
      images.push(`${process.env.AWS_CLOUDFRONT_URL}/${path}`);
    }

    return { data: images };
  }

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('meetup', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }

  //?-------------------------------------------------------------------------//
  //? 참가신청한 모든 사용자 리스트
  //?-------------------------------------------------------------------------//

  async getAllJoiners(id: number): Promise<any> {
    try {
      const meetup = await this.repository.findOneOrFail({
        where: {
          id: id,
        },
        relations: ['joins', 'joins.askingUser', 'joins.askedUser'],
      });
      return meetup.joins
        .filter((v) => v.askedUser.id === meetup.userId)
        .map((v) => v.askingUser);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async getAllInvitees(id: number): Promise<any> {
    try {
      const meetup = await this.repository.findOneOrFail({
        where: {
          id: id,
        },
        relations: ['joins', 'joins.askingUser', 'joins.askedUser'],
      });

      return meetup.joins
        .filter((v) => v.askingUser.id === meetup.userId)
        .map((v) => v.askedUser);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? 찜한 모든 사용자 리스트
  //?-------------------------------------------------------------------------//

  async getAllLikers(id: number): Promise<User[]> {
    try {
      const meetup = await this.repository.findOneOrFail({
        where: {
          id: id,
        },
        relations: ['usersLiked', 'usersLiked.user'],
      });

      return meetup.usersLiked.map((v: any) => v.user);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async getAllLikeIds(id: number): Promise<any> {
    try {
      const rows = await this.repository.manager.query(
        'SELECT userId FROM `like` WHERE meetupId = ?',
        [id],
      );

      return rows.map((v: any) => v.userId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? 블락한 모든 사용자 리스트
  //?-------------------------------------------------------------------------//

  async getMeetupReporters(id: number): Promise<any> {
    try {
      const meetup = await this.repository.findOneOrFail({
        where: {
          id: id,
        },
        relations: ['userReports', 'userReports.user'],
      });

      return meetup.userReports.map((v: any) => v.user);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async getMeetupReporterIds(id: number): Promise<Array<Like>> {
    try {
      const rows = await this.repository.manager.query(
        'SELECT userId FROM `report_meetup` WHERE meetupId = ?',
        [id],
      );

      return rows.map((v: any) => v.userId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? test
  //?-------------------------------------------------------------------------//

  async getComments(id: number): Promise<void> {
    this.redisClient.emit('sse.user_joined_meetup', {
      meetupId: id,
      username: 'elantra',
    });
  }
}
