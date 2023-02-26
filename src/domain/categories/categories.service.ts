import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEnum } from 'src/common/enums/category';
import { AnyData } from './../../common/types/index';

import { Category } from 'src/domain/categories/entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(): Promise<AnyData> {
    const data = await this.repository.manager
      .getTreeRepository(Category)
      .findTrees();

    return { data };
  }

  async findBySlug(slug: string): Promise<AnyData> {
    const parent = await this.repository.findOneOrFail({
      where: {
        slug,
      },
    });
    const data = await this.repository.manager
      .getTreeRepository(Category)
      .findDescendantsTree(parent);
    return { data: data.children };
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

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

    // sports
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
    invest.slug = CategoryEnum.TALK_ONLINE;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
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
