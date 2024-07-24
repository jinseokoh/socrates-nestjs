import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import 'moment-timezone';
import * as random from 'randomstring';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LedgerType } from 'src/common/enums';
import { SignedUrl } from 'src/common/types';
import { DataSource, FindOneOptions, In } from 'typeorm';
import { Cache } from 'cache-manager';
import { Category } from 'src/domain/categories/entities/category.entity';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { ChangeUsernameDto } from 'src/domain/users/dto/change-username.dto';
import { ConfigService } from '@nestjs/config';
import { CreateImpressionDto } from 'src/domain/users/dto/create-impression.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { randomImageName, randomName } from 'src/helpers/random-filename';
import { Repository } from 'typeorm/repository/Repository';
import { S3Service } from 'src/services/aws/s3.service';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { SesService } from 'src/services/aws/ses.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { PurchaseCoinDto } from 'src/domain/users/dto/purchase-coin.dto';

@Injectable()
export class UserCategoriesService {
  private readonly env: any;
  private readonly logger = new Logger(UserCategoriesService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(LanguageSkill)
    private readonly languageSkillRepository: Repository<LanguageSkill>,
    @InjectRepository(Secret)
    private readonly secretRepository: Repository<Secret>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    @Inject(SmsClient) private readonly smsClient: SmsClient, // naver
    private readonly sesService: SesService,
    private readonly s3Service: S3Service,
    private readonly fcmService: FcmService,
    private dataSource: DataSource, // for transaction
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
  }

  // 나의 관심사 리스트에서 삭제
  async removeCategories(id: number, ids: number[]): Promise<Array<Interest>> {
    // const user = await this.findById(id, ['categories']);
    await this.repository.manager.query(
      'DELETE FROM `interest` WHERE userId = ? AND categoryId IN (?)',
      [id, ids],
    );

    return await this.getCategories(id);
  }
}
