import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Career as CareerEnum } from 'src/common/enums/career';
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
    career.slug = CareerEnum.HR;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.LEGAL;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.STRATEGY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.DESIGN;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.MARKETING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.HARDWARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.SOFTWARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.EDUCATION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.BIO;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.FINANCE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.COMMERCE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.MEDIA;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ART;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.FOOD;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.BEAUTY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.CONSTRUCTION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.GOVERNMENT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = CareerEnum.ANIMAL;
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
