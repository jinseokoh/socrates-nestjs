import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnyData } from 'src/common/types';
import { Language } from 'src/domain/languages/entities/language.entity';

import { DataSource, Repository } from 'typeorm';

@Injectable()
export class LanguagesService {
  private readonly logger = new Logger(LanguagesService.name);

  constructor(
    @InjectRepository(Language)
    private readonly repository: Repository<Language>,
    private dataSource: DataSource, // for transaction
  ) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(): Promise<AnyData> {
    const data = await this.repository.find();
    return { data };
  }

  async findBySlug(slug: string): Promise<Language> {
    return await this.repository.findOneOrFail({
      where: {
        slug,
      },
    });
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  // synchronously seed data
  async seedLanguages(): Promise<void> {
    const slugs = [
      'arabic',
      'bulgarian',
      'cantonese',
      'danish',
      'dutch',
      'english',
      'finnish',
      'french',
      'german',
      'hungarian',
      'indonesian',
      'italian',
      'japanese',
      'korean',
      'malay',
      'mandarin',
      'polish',
      'portuguese',
      'russian',
      'spanish',
      'swedish',
      'tagalog',
      'thai',
      'turkish',
      'ukrainian',
      'vietnamese',
    ];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await Promise.all(
        slugs.map(async (v) => {
          const lang = new Language({ slug: v });
          return await queryRunner.manager.save(lang);
        }),
      );

      // commit transaction now:
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
