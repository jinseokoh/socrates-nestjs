import { TargetCareer } from 'src/common/enums';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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
    const root = new Career();
    root.slug = TargetCareer.ALL;
    root.depth = 0;
    await this.repository.manager.save(root);

    let career;
    career = new Career();
    career.slug = TargetCareer.STUDENT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.ACCOUNTING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.HR;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.LEGAL;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.STRATEGY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.DESIGN;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.HARDWARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.DEV;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.DEVGAME;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.DEVAI;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.MARKETING;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.EDUCATION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.BIO;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.FINANCE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.COMMERCE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.SALES;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.MEDIA;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.ART;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.ATHLETE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.FOOD;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.BEAUTY;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.CONSTRUCTION;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.GOVERNMENT;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.ANIMAL;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.WELFARE;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
    career = new Career();
    career.slug = TargetCareer.OTHER;
    career.depth = 1;
    career.parent = root;
    await this.repository.manager.save(career);
  }
}
