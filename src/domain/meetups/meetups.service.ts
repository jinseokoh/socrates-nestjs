import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery
} from 'nestjs-paginate';
import { CategoryEnum } from 'src/common/enums/category';

import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { Category } from 'src/domain/meetups/entities/category.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class MeetupsService {
  private readonly logger = new Logger(MeetupsService.name);

  constructor(
    @InjectRepository(Meetup)
    private readonly repository: Repository<Meetup>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // Meetup 생성
  async create(dto: CreateMeetupDto): Promise<Meetup> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: dto.userId },
    });
    if (user.isBanned) {
      throw new BadRequestException(`not allowed to use`);
    }

    const meetup = await this.repository.save(this.repository.create(dto));
    const category = await this.categoryRepository.findOne({
      where: { slug: dto.category },
    });
    const categories = await this.repository.manager
      .getTreeRepository(Category)
      .findAncestors(category);
    categories
      .filter((v: Category) => v.depth > 0)
      .map(async (v: Category) => {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `meetup_category` (meetupId, categoryId) VALUES (?, ?)',
          [meetup.id, v.id],
        );
      });

    return meetup;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Meetup 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Meetup>> {
    const queryBuilder = this.repository
      .createQueryBuilder('meetup')
      .leftJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        title: [FilterOperator.EQ],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Meetup 상세보기
  async findById(id: string, relations: string[] = []): Promise<Meetup> {
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

  async update(id: string, dto: UpdateMeetupDto): Promise<Meetup> {
    const meetup = await this.repository.preload({ id, ...dto });
    if (!meetup) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(meetup);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: string): Promise<Meetup> {
    const Meetup = await this.findById(id);
    return await this.repository.softRemove(Meetup);
  }

  async remove(id: string): Promise<Meetup> {
    const Meetup = await this.findById(id);
    return await this.repository.remove(Meetup);
  }

  //?_________________________________________________________________________//

  async seedCategory(): Promise<void> {
    let leisure: Category;
    let sports: Category;
    let invest: Category;
    let hobby: Category;

    const root = new Category();
    root.slug = 'root';
    await this.repository.manager.save(root);

    const leisureRoot = new Category();
    leisureRoot.slug = 'leisure';
    leisureRoot.depth = 1;
    leisureRoot.parent = root;
    await this.repository.manager.save(leisureRoot);

    leisure = new Category();
    leisure.slug = CategoryEnum.DINING;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.CAFE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.ALCOHOL;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.MOVIE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.NETFLIX;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.WEBTOON;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.THEATER;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.CONCERT;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.STADIUM;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.INDIE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.EXHIBITION;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.PARK;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.THEMEPARK;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.TRAVEL;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.SAUNA;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.TALK_ONLINE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = CategoryEnum.OTHER_LEISURE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);

    // hobby
    const hobbyRoot = new Category();
    hobbyRoot.slug = 'hobby';
    hobbyRoot.depth = 1;
    hobbyRoot.parent = root;
    await this.repository.manager.save(hobbyRoot);

    hobby = new Category();
    hobby.slug = CategoryEnum.GUITAR;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PIANO;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.KARAOKE;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.KPOP_DANCE;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.BALLROOM_DANCE;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.DRAWING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PAINTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.POTTERY;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.CRAFTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.BOARD_GAME;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PC_GAME;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.CONSOLE_GAME;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.FISHING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.CAMPING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.DRIVING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.STEREO;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PLAMODEL;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.COOKING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.SHOPPING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PHOTO_SHOOTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PLANTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.PET;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = CategoryEnum.OTHER_HOBBY;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);

    // sports activities
    const sportsRoot = new Category();
    sportsRoot.slug = 'sports';
    sportsRoot.depth = 1;
    sportsRoot.parent = root;
    await this.repository.manager.save(sportsRoot);

    sports = new Category();
    sports.slug = CategoryEnum.BADMINTON;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.BASEBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.BASKETBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.VOLLEYBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.FOOTBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.FUTSAL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.DODGEBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.RACQUETBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.TENNIS;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.PINGPONG;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.BOWLING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.POOL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.GOLF;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.MOUNTAIN;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.CLIMBING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.BIKE;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.MOUNTAIN_BIKE;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.ROLLER_SKATING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.ICE_SKATING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.SKI;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.SWIMMING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.SCUBA_DIVING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.WALKING; // snowboard
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.RUNNING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.WORKOUT;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.AEROBIC;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.YOGA; // pilates
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.ARCHERY;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.HORSEBACK;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = CategoryEnum.OTHER_SPORTS;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);

    // other
    const otherRoot = new Category();
    otherRoot.slug = 'other';
    otherRoot.depth = 1;
    otherRoot.parent = root;
    await this.repository.manager.save(otherRoot);

    invest = new Category();
    invest.slug = CategoryEnum.ONE_DAY_CLASS;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.VOLUNTARY_ACTIVITY;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.LANGUAGE;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.READING;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.CODING;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.STUDY;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.YOUTUBE;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.SECURITIES;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.CRYPTO;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.ENTREPRENEURSHIP;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.MENTORSHIP;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = CategoryEnum.ALL_OTHER;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
  }
}
