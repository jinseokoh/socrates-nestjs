import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CareerEnum } from 'src/common/enums/career';
import { AnyData } from 'src/common/types';

import { Career } from 'src/domain/careers/entities/career.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CareersService {
  private readonly logger = new Logger(CareersService.name);

  constructor(
    @InjectRepository(Career)
    private readonly repository: Repository<Career>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(): Promise<AnyData> {
    const data = await this.repository.manager
      .getTreeRepository(Career)
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
      .getTreeRepository(Career)
      .findDescendantsTree(parent);
    return { data: data.children };
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedCareer(): Promise<void> {
    let career;

    const root = new Career();
    root.slug = 'root';
    await this.repository.manager.save(root);

    career = new Career();
    career.slug = CareerEnum.STUDENT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ACCOUNTING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.BROADCASTING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.CONSTRUCTION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.DESIGN;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.EDUCATION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ENGINEERING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ENVIRONMENT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.FARMING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.FINANCE_INVESTMENT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.FOOD;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.GAME;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.GOVENMENT_POLITICIAN;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.INFLUENCER;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.AI_ROBOT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.IT_HARDWARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.IT_SOFTWARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.CRYPTO_CURRENCY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.LEGAL_INVESTIGATION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.MEDICAL_BIO;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ANIMAL_BOTANY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.MILITARY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.MOVIE_DRAMA;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.MUSIC;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ART;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.BEAUTY_FASHION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.PUBLIC_SERVICE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.RELIGION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.SALES;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.SPACE_AERO;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.SPORTS;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.TRAVEL;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.WELFARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.OTHER;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
  }
}
