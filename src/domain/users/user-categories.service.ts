import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import 'moment-timezone';
import { In } from 'typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { ConfigService } from '@nestjs/config';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UserCategoriesService {
  private readonly env: any;
  private readonly logger = new Logger(UserCategoriesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    @Inject(ConfigService)
    private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 관심사 (categories) 리스트
  //? ----------------------------------------------------------------------- //

  async getCategories(userId: number): Promise<Interest[]> {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: userId,
      },
      relations: ['categoriesInterested', 'categoriesInterested.category'],
    });

    return user.categoriesInterested;
  }

  //? ----------------------------------------------------------------------- //
  //? 관심사 Sync w/ Ids (기존정보 사라짐)
  //? ----------------------------------------------------------------------- //

  async syncCategoriesWithIds(
    userId: number,
    ids: number[],
  ): Promise<Interest[]> {
    await this._wipeOutInterests(userId);
    await Promise.all(
      ids.map(async (v: number) => {
        await this.interestRepository.manager.query(
          'INSERT IGNORE INTO `interest` (userId, categoryId) VALUES (?, ?)',
          [userId, v],
        );
      }),
    );
    return await this.getCategories(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 관심사 Sync w/ Slugs (기존정보 사라짐)
  //? ----------------------------------------------------------------------- //

  async syncCategoriesWithSlugs(
    userId: number,
    slugs: string[],
  ): Promise<Interest[]> {
    await this._wipeOutInterests(userId);
    const categories = await this.categoryRepository.findBy({
      slug: In(slugs),
    });
    const slugIds = categories.map((v) => v.id);
    await Promise.all(
      slugIds.map(async (v: number) => {
        await this.interestRepository.manager.query(
          'INSERT IGNORE INTO `interest` (userId, categoryId) VALUES (?, ?)',
          [userId, v],
        );
      }),
    );
    return await this.getCategories(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 관심사 Upsert w/ Skill
  //? ----------------------------------------------------------------------- //

  async upsertCategoryWithSkill(
    userId: number,
    slug: string,
    skill: number,
  ): Promise<Interest[]> {
    try {
      const category = await this.categoryRepository.findOneBy({
        slug: slug,
      });
      if (category !== null) {
        await this.interestRepository.manager.query(
          'INSERT IGNORE INTO `interest` \
    (userId, categoryId, skill) VALUES (?, ?, ?) \
    ON DUPLICATE KEY UPDATE \
    userId = VALUES(`userId`), \
    categoryId = VALUES(`categoryId`), \
    skill = VALUES(`skill`)',
          [userId, category.id, skill],
        );
      }

      return await this.getCategories(userId);
    } catch (e) {
      throw new NotFoundException('category not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? 관심사 삭제
  //? ----------------------------------------------------------------------- //

  async removeCategories(userId: number, ids: number[]): Promise<Interest[]> {
    const { affectedRows } = await this.userRepository.manager.query(
      'DELETE FROM `interest` WHERE userId = ? AND categoryId IN (?)',
      [userId, ids],
    );

    return await this.getCategories(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? privates
  //? ----------------------------------------------------------------------- //

  async _wipeOutInterests(userId: number): Promise<void> {
    await this.interestRepository.manager.query(
      'DELETE FROM `interest` WHERE userId = ?',
      [userId],
    );
  }
}
