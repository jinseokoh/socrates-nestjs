import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
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
    private readonly repository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(ConfigService)
    private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? 관심사 Categories
  //?-------------------------------------------------------------------------//

  // 사용자 관심사 리스트
  async getCategories(id: number): Promise<Array<Interest>> {
    const user = await this.repository.findOneOrFail({
      where: {
        id: id,
      },
      relations: ['categoriesInterested', 'categoriesInterested.category'],
    });

    return user.categoriesInterested;
  }

  // 나의 관심사 리스트에 추가 (w/ ids)
  async syncCategoriesWithIds(
    id: number,
    ids: number[],
  ): Promise<Array<Interest>> {
    // 1. delete only removed ones
    const user = await this.repository.findOneOrFail({
      where: {
        id: id,
      },
      relations: ['categoriesInterested'],
    });
    const previousIds = user.categoriesInterested.map((v) => v.categoryId);
    const removedIds = previousIds.filter((v) => !ids.includes(v));
    if (removedIds.length > 0) {
      await this.repository.manager.query(
        'DELETE FROM `interest` WHERE userId = ? AND categoryId IN (?)',
        [id, removedIds],
      );
    }

    // 2. upsert newly added ones
    await Promise.all(
      ids.map(async (v: number) => {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `interest` (userId, categoryId) VALUES (?, ?)',
          [id, v],
        );
      }),
    );
    return await this.getCategories(id);
  }

  // 나의 관심사 리스트에 추가 (w/ slugs)
  async syncCategoriesWithSlugs(
    id: number,
    slugs: string[],
  ): Promise<Array<Interest>> {
    // preparation to extract categoryIds
    const categories = await this.categoryRepository.findBy({
      slug: In(slugs),
    });
    const newIds = categories.map((v) => v.id);

    // 1. delete only removed ones
    const user = await this.repository.findOneOrFail({
      where: {
        id: id,
      },
      relations: ['categoriesInterested'],
    });
    const previousIds = user.categoriesInterested.map((v) => v.categoryId);
    const removedIds = previousIds.filter((v) => !newIds.includes(v));
    if (removedIds.length > 0) {
      await this.repository.manager.query(
        'DELETE FROM `interest` WHERE userId = ? AND categoryId IN (?)',
        [id, removedIds],
      );
    }
    // 2. upsert newly added ones
    await Promise.all(
      categories.map(async (v: Category) => {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `interest` (userId, categoryId) VALUES (?, ?)',
          [id, v.id],
        );
      }),
    );
    return await this.getCategories(id);
  }

  // 나의 관심사 리스트 UPSERT
  async upsertCategoryWithSkill(
    id: number,
    slug: string,
    skill: number,
  ): Promise<Array<Interest>> {
    try {
      const category = await this.categoryRepository.findOneBy({
        slug: slug,
      });
      if (category !== null) {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `interest` \
    (userId, categoryId, skill) VALUES (?, ?, ?) \
    ON DUPLICATE KEY UPDATE \
    userId = VALUES(`userId`), \
    categoryId = VALUES(`categoryId`), \
    skill = VALUES(`skill`)',
          [id, category.id, skill],
        );
      }
      return await this.getCategories(id);
    } catch (e) {
      throw new BadRequestException('category not found');
    }
  }

  // 나의 관심사 리스트에서 삭제
  async removeCategories(id: number, ids: number[]): Promise<Array<Interest>> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `interest` WHERE userId = ? AND categoryId IN (?)',
      [id, ids],
    );
    return await this.getCategories(id);
  }
}
