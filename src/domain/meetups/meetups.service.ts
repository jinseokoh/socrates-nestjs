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
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/meetups/entities/venue.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { randomImageName, randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { DataSource, In } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Room } from 'src/domain/chats/entities/room.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { LedgerType } from 'src/common/enums';

@Injectable()
export class MeetupsService {
  private readonly logger = new Logger(MeetupsService.name);

  constructor(
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    private readonly s3Service: S3Service,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  //! 모임 생성 (using transaction)
  //! profile's balance will be adjusted w/ ledger model event subscriber.
  async create(dto: CreateMeetupDto): Promise<Meetup> {
    // create a new query runner
    console.log(dto);
    const queryRunner = this.dataSource.createQueryRunner();
    const cost = dto.hasQa ? 1 : 0;

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const user = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.userId },
        relations: [`profile`],
      });

      if (user?.isBanned) {
        throw new BadRequestException(`a banned user`); //
      }

      if (
        (cost > 0 && user.profile?.balance === null) ||
        user.profile?.balance - cost < 0
      ) {
        throw new BadRequestException(`insufficient balance`); //
      }

      const newBalance = user.profile?.balance - cost;
      user.profile.balance = newBalance;

      let venue = await queryRunner.manager.findOne(Venue, {
        where: {
          providerId: dto.venue.providerId,
        },
      });
      if (!venue) {
        const v = new Venue({
          image: dto.venue.image,
          name: dto.venue.name,
          address: dto.venue.address,
          tags: dto.venue.tags,
          latitude: dto.venue.latitude,
          longitude: dto.venue.longitude,
          providerId: dto.venue.providerId,
        });
        venue = await queryRunner.manager.save(v);
      }

      const careers = await queryRunner.manager.getRepository(Career).find({
        where: { slug: In(dto.targetCareers) },
      });

      const category = await queryRunner.manager
        .getRepository(Category)
        .findOne({
          where: { slug: dto.subCategory },
        });

      const ancestors = await queryRunner.manager
        .getTreeRepository(Category)
        .findAncestors(category);

      const categories = ancestors
        .filter((v: Category) => v.depth > 0) // remove root
        .map((v: Category) => v);

      //? 저장할 엔티티 생성
      const newMeetup = new Meetup({
        category: dto.category,
        subCategory: dto.subCategory,
        title: dto.title,
        description: dto.description,
        images: dto.images,
        targetGender: dto.targetGender,
        targetMinAge: dto.targetMinAge,
        targetMaxAge: dto.targetMaxAge,
        targetCareers: dto.targetCareers,
        skill: dto.skill,
        max: dto.max,
        day: dto.day,
        times: dto.times,
        amount: dto.amount,
        expenses: dto.expenses,
        region: dto.region,
        patron: dto.patron,
        hasQa: dto.hasQa,
        expiredAt: dto.expiredAt,
        user: user,
        venue: venue,
        careers: careers,
        categories: categories,
      });
      newMeetup.user = user;

      //? 생성된 엔티티를 queryRunner를 사용하여 저장
      const meetup = await queryRunner.manager.save(newMeetup);

      //? create a Ledger if needed
      if (cost > 0) {
        const ledger = new Ledger({
          credit: cost,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `모임 생성료 (대상#${meetup.id})`,
          userId: user.id,
        });
        await queryRunner.manager.save(ledger);
      }

      //? create a Room
      await queryRunner.manager.query(
        'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
        ['host', dto.userId, meetup.id],
      );

      //? update the User's Interests
      if (category !== null) {
        await queryRunner.manager.query(
          'INSERT IGNORE INTO `interest` (userId, categoryId, skill) VALUES (?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  categoryId = VALUES(`categoryId`), \
  skill = VALUES(`skill`)',
          [dto.userId, category.id, dto.skill],
        );
      }

      //? 트랜잭션 커밋
      await queryRunner.commitTransaction();

      return newMeetup;
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ------------------------------------------------------------------------ //
  // set relations
  // ------------------------------------------------------------------------ //

  async _getCategoriesBySlug(slug: string): Promise<Category[]> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });
    const categories = await this.meetupRepository.manager
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

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  // Meetup 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
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
  async fetchRoomByMeetupId(id: number): Promise<Room> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id },
      relations: ['room', 'room.participants', 'room.participants.profile'],
    });

    return meetup.room;
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Meetup> {
    try {
      await this.increaseViewCount(id);
      return relations.length > 0
        ? await this.meetupRepository.findOneOrFail({
            where: { id },
            relations,
            order: {
              meetupComments: {
                id: 'DESC',
              },
            },
          })
        : await this.meetupRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateMeetupDto): Promise<Meetup> {
    const meetup = await this.meetupRepository.preload({ id, ...dto });
    if (!meetup) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.meetupRepository.save(meetup);
  }

  async increaseViewCount(id: number): Promise<void> {
    await this.meetupRepository
      .createQueryBuilder()
      .update(Meetup)
      .where('id = :id', { id })
      .set({ viewCount: () => 'viewCount + 1' })
      .execute();
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<Meetup> {
    const meetup = await this.findById(id);
    return await this.meetupRepository.softRemove(meetup);
  }

  async remove(id: number): Promise<Meetup> {
    const meetup = await this.findById(id);
    return await this.meetupRepository.remove(meetup);
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

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
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'meetup', dto.mimeType);
    const path = `${process.env.NODE_ENV}/meetups/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }

  //? ----------------------------------------------------------------------- //
  //? 참가신청한 모든 사용자 리스트
  //? ----------------------------------------------------------------------- //

  async getAllJoiners(id: number): Promise<any> {
    try {
      const meetup = await this.meetupRepository.findOneOrFail({
        where: {
          id: id,
        },
        relations: ['joins', 'joins.user', 'joins.recipient'],
      });
      return meetup.joins
        .filter((v) => v.recipient.id === meetup.userId)
        .map((v) => v.user);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async getAllInvitees(id: number): Promise<any> {
    try {
      const meetup = await this.meetupRepository.findOneOrFail({
        where: {
          id: id,
        },
        relations: ['joins', 'joins.user', 'joins.recipient'],
      });

      return meetup.joins
        .filter((v) => v.user.id === meetup.userId)
        .map((v) => v.recipient);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }
}
