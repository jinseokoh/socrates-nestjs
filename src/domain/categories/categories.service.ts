import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from 'src/common/enums/subcategory';
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
    let hobby: Category;
    let sports: Category;
    let challenge: Category;

    const root = new Category({
      slug: 'all',
    });
    await this.repository.manager.save(root);

    // challenge
    const challengeRoot = new Category({
      slug: 'challenge',
      depth: 1,
      parent: root,
    });
    await this.repository.manager.save(challengeRoot);

    challenge = new Category({
      slug: SubCategory.IT_PROJECT,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.YOUTUBE_PROJECT,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.ENTREPRENEURSHIP,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.STUDY,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.LANGUAGE,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.CODING,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.BOOK,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.STOCKS,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.ONE_DAY_CLASS,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.VOLUNTEERING,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    challenge = new Category({
      slug: SubCategory.OTHER_CHALLENGE,
      depth: 2,
      parent: challengeRoot,
    });
    await this.repository.manager.save(challenge);

    // sports
    const sportsRoot = new Category({
      slug: 'sports',
      depth: 1,
      parent: root,
    });
    await this.repository.manager.save(sportsRoot);

    sports = new Category({
      slug: SubCategory.BASKETBALL,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.VOLLEYBALL,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.BASEBALL,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.FOOTBALL,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.TENNIS,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.BADMINTON,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.PINGPONG,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.BOWLING,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.POOL,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.GOLF,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.MOUNTAIN,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.CLIMBING,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.BIKE,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);
    sports = new Category({
      slug: SubCategory.SKATING,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.SKI,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.SWIMMING,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.SCUBA_DIVING,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.RUNNING,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.GYM, // pilate
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    sports = new Category({
      slug: SubCategory.OTHER_SPORTS,
      depth: 2,
      parent: sportsRoot,
    });
    await this.repository.manager.save(sports);

    // leisure
    const leisureRoot = new Category({
      slug: 'leisure',
      depth: 1,
      parent: root,
    });
    await this.repository.manager.save(leisureRoot);

    leisure = new Category({
      slug: SubCategory.DINING,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.CAFE,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.ALCOHOL,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.MOVIE,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.THEATER,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.CONCERT,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.STADIUM,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.EXHIBITION,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.POPUP,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.PARK,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    leisure = new Category({
      slug: SubCategory.OTHER_LEISURE,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(leisure);

    // hobby
    const hobbyRoot = new Category({
      slug: 'hobby',
      depth: 1,
      parent: root,
    });
    await this.repository.manager.save(hobbyRoot);

    hobby = new Category({
      slug: SubCategory.DRAWING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.CRAFTING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.MUSICAL_INSTRUMENT,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.KARAOKE,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.DANCING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.GAME,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.FISHING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.CAMPING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.TRAVEL,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.DRIVE,
      depth: 2,
      parent: leisureRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.COOKING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.WRITING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.PHOTO_SHOOTING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.PLANTING,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.PET,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);

    hobby = new Category({
      slug: SubCategory.OTHER_HOBBY,
      depth: 2,
      parent: hobbyRoot,
    });
    await this.repository.manager.save(hobby);
  }
}
