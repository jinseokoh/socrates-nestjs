import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from 'src/common/enums/sub-category';
import { AnyData } from 'src/common/types';
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
    leisure.slug = SubCategory.DINING;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.CAFE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.ALCOHOL;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.MOVIE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.THEATER;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.CONCERT;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.STADIUM;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.INDIE;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.EXHIBITION;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.PARK;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.TRAVEL;
    leisure.depth = 2;
    leisure.parent = leisureRoot;
    await this.repository.manager.save(leisure);
    leisure = new Category();
    leisure.slug = SubCategory.OTHER_LEISURE;
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
    hobby.slug = SubCategory.MUSICAL_INSTRUMENT;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.KARAOKE;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.DANCING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.DRAWING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.PAINTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.POTTERY;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.CRAFTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.BOARD_GAME;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.GAME;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.FISHING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.CAMPING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.DRIVING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.COOKING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.SHOPPING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.PHOTO_SHOOTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.PLANTING;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.PET;
    hobby.depth = 2;
    hobby.parent = hobbyRoot;
    await this.repository.manager.save(hobby);
    hobby = new Category();
    hobby.slug = SubCategory.OTHER_HOBBY;
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
    sports.slug = SubCategory.BADMINTON;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.BASEBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.BASKETBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.VOLLEYBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.FOOTBALL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.FUTSAL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.TENNIS;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.PINGPONG;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.BOWLING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.POOL;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.GOLF;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.MOUNTAIN;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.CLIMBING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.BIKE;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.ROLLER_SKATING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.ICE_SKATING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.SKI;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.SWIMMING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.SCUBA_DIVING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.WALKING; // snowboard
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.RUNNING;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.WORKOUT;
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.YOGA; // pilates
    sports.depth = 2;
    sports.parent = sportsRoot;
    await this.repository.manager.save(sports);
    sports = new Category();
    sports.slug = SubCategory.OTHER_SPORTS;
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
    invest.slug = SubCategory.TALK_ONLINE;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.ONE_DAY_CLASS;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.VOLUNTARY_ACTIVITY;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.LANGUAGE;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.READING;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.CODING;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.STUDY;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.YOUTUBE;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.SECURITIES;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.CRYPTO;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.ENTREPRENEURSHIP;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
    invest = new Category();
    invest.slug = SubCategory.ALL_OTHER;
    invest.depth = 2;
    invest.parent = otherRoot;
    await this.repository.manager.save(invest);
  }
}
