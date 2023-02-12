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
    root.slug = 'ROOT';
    await this.repository.manager.save(root);

    const leisureRoot = new Category();
    leisureRoot.slug = 'LEISURE';
    leisureRoot.depth = 1;
    leisureRoot.parent = root;
    await this.repository.manager.save(leisureRoot);

    leisure = new Category();
    leisure.slug = 'DINING';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'COFFEE';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'ALCOHOL';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'MOVIE';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'NETFLIX';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'WEBTOON';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'THEATER';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'CONCERT';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'STADIUM';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'INDIE';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'EXHIBITION';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'PARK';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'THEMEPARK';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'SAUNA';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = 'OTHER_LEISURE';
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);

    // hobby
    const hobbyRoot = new Category();
    hobbyRoot.slug = 'HOBBY';
    hobbyRoot.depth = 1;
    hobbyRoot.parent = root;
    await this.repository.manager.save(hobbyRoot);
    hobby = new Category();
    hobby.slug = 'GUITAR';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'PIANO';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'KARAOKE';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'KPOP_DANCE';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'BALLROOM_DANCE';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'DRAWING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'PAINTING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'POTTERY';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'CRAFTING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'BOARD_GAME';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'PC_GAME';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'CONSOLE_GAME';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'FISHING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'CAMPING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'DRIVING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'STEREO';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'COOKING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'SHOPPING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'PHOTOSHOOTING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'PLANTING';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'PET';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = 'OTHER_HOBBY';
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);

    // sports activities
    const sportsRoot = new Category();
    sportsRoot.slug = 'SPORTS';
    sportsRoot.depth = 1;
    sportsRoot.parent = root;
    await this.repository.manager.save(sportsRoot);
    sports = new Category();
    sports.slug = 'AEROBIC';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'ARCHERY';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'BADMINTON';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'BASEBALL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'BASKETBALL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'BIKE';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'BOWLING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'CLIMBING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'DODGEBALL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'FOOTBALL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'FUTSAL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'GOLF';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'HORSEBACK';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'ICESKATING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'MOUNTAIN';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'MOUNTAINBIKE';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'PINPONG';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'POOL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'RACQUETBALL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'ROLLERSKATING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'RUNNING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'SCUBADIVING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'SKI'; // snowboard
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'SWIMMING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'TENNIS';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'VOLLEYBALL';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'WALKING';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'WORKOUT';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'YOGA'; // pilates
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = 'OTHER_SPORTS';
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);

    // investment
    const investRoot = new Category();
    investRoot.slug = 'INVESTMENT';
    investRoot.depth = 1;
    investRoot.parent = root;
    await this.repository.manager.save(investRoot);
    invest = new Category();
    invest.slug = 'CLASS';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'LANGUAGE';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'READING';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'CODING';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'STUDY';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'YOUTUBE';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'SECURITIES';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'CRYPTO';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'ENTREPRENEURSHIP';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'MENTORSHIP';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = 'OTHER_INVESTMENT';
    invest.depth = 2;
    invest.parent = investRoot;
    await this.repository.manager.save(invest);
  }
}
