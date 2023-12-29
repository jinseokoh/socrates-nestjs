import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import * as random from 'randomstring';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Emotion,
  JoinType,
  JoinStatus,
  Ledger as LedgerType,
} from 'src/common/enums';
import { AnyData, SignedUrl } from 'src/common/types';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune.dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { ChangeUsernameDto } from 'src/domain/users/dto/change-username.dto';
import { CreateImpressionDto } from 'src/domain/users/dto/create-impression.dto';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune.dto';
import { ConfigService } from '@nestjs/config';
import { Brackets, DataSource, FindOneOptions, In } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { ReportConnection } from 'src/domain/connections/entities/report_connection.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { ReportMeetup } from 'src/domain/meetups/entities/report_meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { ReportUser } from 'src/domain/users/entities/report_user.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { Cache } from 'cache-manager';
import { initialUsername } from 'src/helpers/random-username';
import { randomName } from 'src/helpers/random-filename';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { SesService } from 'src/services/aws/ses.service';
import { S3Service } from 'src/services/aws/s3.service';
import { CrawlerService } from 'src/services/crawler/crawler.service';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';

@Injectable()
export class UsersService {
  private readonly env: any;
  private readonly logger = new Logger(UsersService.name);

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
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    @InjectRepository(Hate)
    private readonly hateRepository: Repository<Hate>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Join)
    private readonly joinRepository: Repository<Join>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(ReportMeetup)
    private readonly reportMeetupRepository: Repository<ReportMeetup>,
    @InjectRepository(ReportConnection)
    private readonly reportConnectionRepository: Repository<ReportConnection>,
    @InjectRepository(ReportUser)
    private readonly reportUserRepository: Repository<ReportUser>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    @Inject(SmsClient) private readonly smsClient: SmsClient, // naver
    private readonly sesService: SesService,
    private readonly s3Service: S3Service,
    private readonly crawlerService: CrawlerService,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // [관리자] User 생성
  async create(dto: CreateUserDto): Promise<User> {
    return await this.repository.save(this.repository.create(dto));
  }

  async createImpression(dto: CreateImpressionDto): Promise<number[]> {
    const id = dto.userId;
    try {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `impression` \
  (appearance, knowledge, confidence, humor, manner, posterId, userId) VALUES (?, ?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  appearance = VALUES(`appearance`), \
  knowledge = VALUES(`knowledge`), \
  confidence = VALUES(`confidence`), \
  humor = VALUES(`humor`), \
  manner = VALUES(`manner`), \
  posterId = VALUES(`posterId`), \
  userId = VALUES(`userId`)',
        [
          dto.appearance,
          dto.knowledge,
          dto.confidence,
          dto.humor,
          dto.manner,
          dto.posterId, // 평가하는 사용자
          dto.userId, // 평가받는 사용자
        ],
      );

      const user = await this.findById(id, ['impressions']);
      if (user.impressions && user.impressions.length > 1) {
        const impressions = await this.getImpressionAverageById(id);
        const dto = new UpdateProfileDto();
        dto.impressions = impressions;
        await this.updateProfile(id, dto);
        return impressions;
      } else {
        return [];
      }
    } catch (e) {
      this.logger.log(e);
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // User 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<User> = {
      sortableColumns: ['id', 'username', 'email'],
      searchableColumns: ['email', 'username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        role: [FilterOperator.EQ, FilterOperator.IN],
        isActive: [FilterOperator.EQ],
      },
    };

    return await paginate<User>(query, queryBuilder, config);
  }

  // User 상세보기 (w/ id)
  async findUserDetailById(
    id: number,
    relations: string[] = [],
  ): Promise<User> {
    try {
      const [data] = await this.repository.manager.query(
        'SELECT \
  (SELECT COUNT(*) FROM `follow` WHERE `followingId` = ?) AS followerCount, \
  (SELECT COUNT(*) FROM `follow` WHERE `followerId` = ?) AS followingCount \
  ',
        [id, id],
      );
      const response = await this.repository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: true,
      });

      return response;
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // User 상세보기 (w/ id)
  async findById(id: number, relations: string[] = []): Promise<User> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
            withDeleted: true,
          })
        : await this.repository.findOneOrFail({
            where: { id },
            withDeleted: true,
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // User 상세보기 (w/ unique key)
  async findByUniqueKey(params: FindOneOptions): Promise<User> {
    return await this.repository.findOne(params);
  }

  // User 상세보기 (w/ id)
  async getImpressionAverageById(id: number): Promise<number[]> {
    try {
      const [row] = await this.repository.manager.query(
        'SELECT \
AVG(appearance) AS appearance, \
AVG(knowledge) AS knowledge, \
AVG(confidence) AS confidence, \
AVG(humor) AS humor, \
AVG(manner) AS manner \
FROM impression \
GROUP BY userId HAVING userId = ?',
        [id],
      );

      const data = [
        +parseFloat(row['appearance']).toFixed(2),
        +parseFloat(row['knowledge']).toFixed(2),
        +parseFloat(row['confidence']).toFixed(2),
        +parseFloat(row['humor']).toFixed(2),
        +parseFloat(row['manner']).toFixed(2),
      ];

      this.logger.log(data);

      return data;
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  getInitialUsername(id: number): string {
    return initialUsername(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // [관리자] User 갱신
  async updateExtended(id: number, body: any): Promise<User> {
    // avatar
    if (!body.avatar) {
      body.avatar = 'https://cdn.fleaauction.world/images/user.png';
    }
    // profile
    const profileDto: UpdateProfileDto = new UpdateProfileDto();
    Object.keys(body).filter((key) => {
      if (key.startsWith('profile.') && body[key] !== null) {
        const pKey = key.replace('profile.', '');
        profileDto[pKey] =
          typeof body[key] === 'string' ? body[key].trim() : body[key];
      }
    });
    if (body.profileId > 0) {
      const profile = await this.profileRepository.preload({
        id: body.profileId,
        ...profileDto,
      });
      await this.profileRepository.save(profile);
    }

    // user
    const user = await this.repository.preload({ id, ...body });
    const a = await this.repository.save(user);
    return a;
  }

  // User 갱신
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

  //? User 닉네임 갱신
  //? 코인 비용이 발생할 수 있음.
  //! balance will be adjusted w/ model event subscriber.
  //! using transaction using query runner
  async changeUsername(id: number, dto: ChangeUsernameDto): Promise<number> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const count = await queryRunner.manager.count(User, {
      where: { username: dto.username },
    });
    const user = await queryRunner.manager.findOne(User, {
      where: { id: id },
      relations: [`profile`],
    });
    const newBalance = user.profile?.balance - dto.costToUpdate;
    await queryRunner.startTransaction();
    try {
      if (count > 0) {
        throw new UnprocessableEntityException(`the username is taken`);
      }
      if (!user) {
        throw new NotFoundException(`the user is not found`);
      }
      if (user?.isBanned) {
        throw new UnprocessableEntityException(`the user is banned`);
      }
      if (
        user.profile?.balance === null ||
        user.profile?.balance - dto.costToUpdate < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }
      if (dto.costToUpdate > 0) {
        const ledger = new Ledger({
          credit: dto.costToUpdate,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `사용자명 변경료 (user #${id})`,
          userId: id,
        });
        await queryRunner.manager.save(ledger);
      }
      user.username = dto.username;
      await queryRunner.manager.save(user);
      // commit transaction now:
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return newBalance;
  }

  // User 비밀번호 갱신
  async changePassword(id: number, dto: ChangePasswordDto): Promise<User> {
    const user = await this.findById(id);
    const passwordMatches = await bcrypt.compare(dto.current, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('invalid credentials');
    }
    user.password = dto.password;
    return await this.repository.save(user);
  }

  // User 와 연계된 Profile 갱신
  async updateProfile(id: number, dto: UpdateProfileDto): Promise<Profile> {
    const user = await this.findById(id, ['profile']);
    const profileId = user.profile.id;

    const profile = await this.profileRepository.preload({
      id: profileId,
      ...dto,
    });
    return await this.profileRepository.save(profile);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.softRemove(user);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.remove(user);
  }

  // User 탈퇴
  async quit(id: number, dto: DeleteUserDto): Promise<any> {
    const user = await this.findById(id);
    try {
      // following 관계 hard 삭제
      await this._hardRemovalOnFollow(id);
      // stock comment soft 삭제 (commeted out for now)
      // await this._softRemovalOnStockComments(id);
      // private information 변경
      await this._voidPersonalInformation(id);

      // update user model
      user.pushToken = dto.reason;
      user.isActive = false;
      user.isBanned = false;
      await this.repository.save(user);

      await this.softRemove(id);
    } catch (e) {
      throw new BadRequestException('already deleted');
    }

    // this.slack.send(
    //   `[local-test] 다음 사용자가 탈퇴했습니다.\n- 아이디:${id}\n- 이름:${user.username}(실명:${user.realname})\n- 전화:${user.phone}\n- 이메일:${user.email}`,
    // );

    return {
      data: 'ok',
    };
  }

  //--------------------------------------------------------------------------//
  // Removal logics when user closes his/her account
  //--------------------------------------------------------------------------//

  async _hardRemovalOnFollow(id: number) {
    await this.repository.manager.query(
      'DELETE FROM follow WHERE followingId = ? OR followerId = ?',
      [id, id],
    );
  }

  async _voidPersonalInformation(id: number): Promise<any> {
    const user = await this.findById(id);
    const email = user.email;
    const phone = user.phone;
    user.email = `${email}.deleted`;
    user.phone = `---${phone.substring(3)}`;
    await this.repository.save(user);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // User 프로필사진 갱신
  async upload(id: number, file: Express.Multer.File): Promise<User> {
    // see if id is valid
    await this.findById(id);
    const path = `local/users/${id}/${randomName('avatar')}`;
    try {
      // image processing using Jimp
      await this.s3Service.uploadWithResizing(file, path, 640);
    } catch (e) {
      this.logger.log(e);
    }
    // upload the manipulated image to S3
    // update users table
    const avatar = `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
    return this.update(id, { avatar });
  }

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('avatar', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }

  //?-------------------------------------------------------------------------//
  //? OTP
  //?-------------------------------------------------------------------------//

  // 본인인증 OTP SMS 발송
  // 전화번호/이메일 확인 후 OTP 전송
  async sendOtpForNonExistingUser(val: string, cache = false): Promise<void> {
    const phone = val.replace(/-/gi, '');
    const where = val.includes('@') ? { email: val } : { phone: phone };
    const user = await this.findByUniqueKey({ where });
    if (user) {
      throw new UnprocessableEntityException('already taken');
    }
    const otp = cache
      ? await this._upsertOtpWithCache(phone)
      : await this._upsertOtp(phone);

    if (val.includes('@')) {
      await this.sesService.sendOtpEmail(val, otp);
    } else {
      console.log(phone, otp);
      await this._sendSmsTo(phone, otp);
    }
  }

  // 기존회원 본인인증정보 수정) 전화번호/이메일 확인 후 OTP 전송
  async sendOtpForExistingUser(val: string, cache = false): Promise<void> {
    const phone = val.replace(/-/gi, '');
    const where = val.includes('@') ? { email: val } : { phone: phone };
    const user = await this.findByUniqueKey({ where });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const otp = cache
      ? await this._upsertOtpWithCache(phone)
      : await this._upsertOtp(phone);

    if (val.includes('@')) {
      await this.sesService.sendOtpEmail(val, otp);
    } else {
      console.log(phone, otp);
      await this._sendSmsTo(phone, otp);
    }
  }

  // OTP 검사
  async checkOtp(val: string, otp: string, cache = false): Promise<void> {
    const phone = val.replace(/-/gi, '');
    if (cache) {
      const cacheKey = this._getCacheKey(phone);
      const cachedOtp = await this.cacheManager.get(cacheKey);
      if (!cachedOtp) {
        throw new UnprocessableEntityException('otp expired');
      } else if (cachedOtp !== otp) {
        throw new UnprocessableEntityException('otp mismatched');
      }
    } else {
      const secret = await this.secretRepository.findOne({
        where: { key: phone },
      });
      if (!secret) {
        throw new UnprocessableEntityException('otp unavailable');
      }
      const now = moment();
      const expiredAt = moment(secret.updatedAt).add(3, 'minutes');

      if (now.isAfter(expiredAt)) {
        throw new UnprocessableEntityException(`otp expired`);
      }
      if (secret.otp !== otp) {
        throw new UnprocessableEntityException('otp mismatched');
      }
    }
  }

  //?-------------------------------------------------------------------------//
  //? OTP 관련 privates
  //?-------------------------------------------------------------------------//

  _getCacheKey(key: string): string {
    return `${this.env}:user:${key}:key`;
  }

  async _upsertOtp(phone: string, length = 6): Promise<string> {
    const otp = random.generate({ length, charset: 'numeric' });
    await this.secretRepository.upsert([{ key: phone, otp: otp }], ['key']);
    return otp;
  }

  async _upsertOtpWithCache(phone: string, length = 6): Promise<string> {
    const otp = random.generate({ length, charset: 'numeric' });
    const cacheKey = this._getCacheKey(phone);
    await this.cacheManager.set(cacheKey, otp, 60 * 10);
    return otp;
  }

  async _sendSmsTo(phone: string, otp: string): Promise<any> {
    const body = `[미소] 인증코드 ${otp}`;
    try {
      await this.smsClient.send({
        to: phone,
        content: body,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('aws-ses error');
    }
  }

  //?-------------------------------------------------------------------------//
  //? Some Extra shit
  //?-------------------------------------------------------------------------//

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async increasePayCount(id: number): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `profile` SET payCount = payCount + 1 WHERE userId = ?',
      [id],
    );
  }

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async decreasePayCount(id: number): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `profile` SET payCount = payCount - 1 WHERE userId = ? AND payCount > 0',
      [id],
    );
  }

  //?-------------------------------------------------------------------------//
  //? Connections
  //?-------------------------------------------------------------------------//

  // 내가 만든 발견 리스트
  async getMyConnections(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    const queryBuilder = this.connectionRepository
      .createQueryBuilder('connection')
      .innerJoinAndSelect('connection.dot', 'dot')
      .innerJoinAndSelect('connection.user', 'user')
      .leftJoinAndSelect('connection.remarks', 'remarks')
      .where({
        userId,
      });

    const config: PaginateConfig<Connection> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['answer'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? Meetups
  //?-------------------------------------------------------------------------//

  // 내가 만든 모임 리스트
  async getMyMeetups(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        userId,
      });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? 언어 LanguageSkills
  //?-------------------------------------------------------------------------//

  // 사용자 언어 리스트
  async getLanguageSkills(userId: number): Promise<Array<LanguageSkill>> {
    const user = await this.repository.findOneOrFail({
      where: {
        id: userId,
      },
      relations: ['languageSkills', 'languageSkills.language'],
    });

    return user.languageSkills;
  }

  // 나의 언어 리스트 UPSERT
  async upsertLanguageSkills(
    userId: number,
    items: Array<LanguageSkill>,
  ): Promise<Array<LanguageSkill>> {
    await this.repository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ?',
      [userId],
    );

    await this.languageSkillRepository.upsert(items, [`userId`, `languageId`]);

    return await this.getLanguageSkills(userId);
  }

  // 나의 언어 리스트에서 삭제
  async removeLanguages(
    userId: number,
    ids: number[],
  ): Promise<Array<LanguageSkill>> {
    // const user = await this.findById(id, ['categories']);
    await this.repository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ? AND languageId IN (?)',
      [userId, ids],
    );

    return await this.getLanguageSkills(userId);
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

  //?-------------------------------------------------------------------------//
  //? 차단 (Hate)
  //?-------------------------------------------------------------------------//

  // 블락한 사용자 리스트에 추가
  async attachUserIdToHatePivot(
    hatingUserId: number,
    hatedUserId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `hate` (hatingUserId, hatedUserId, message) VALUES (?, ?, ?)',
      [hatingUserId, hatedUserId, message],
    );
  }

  // 블락한 사용자 리스트에서 삭제
  async detachUserIdFromHatePivot(
    hatingUserId: number,
    hatedUserId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `hate` WHERE hatingUserId = ? AND hatedUserId = ?',
      [hatingUserId, hatedUserId],
    );
  }

  // 내가 블락한 사용자 리스트
  async getUsersHatedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Hate>> {
    const queryBuilder = this.hateRepository
      .createQueryBuilder('hate')
      .innerJoinAndSelect('hate.hatedUser', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where({
        hatingUserId: userId,
      });

    const config: PaginateConfig<Hate> = {
      sortableColumns: ['hatedUserId'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['hatedUserId', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 블락하거나 나를 블락한 ids
  async getUserIdsEitherHatingOrBeingHated(userId: number): Promise<AnyData> {
    const rows = await this.repository.manager.query(
      'SELECT hatingUserId, hatedUserId \
      FROM `hate` \
      WHERE hatingUserId = ? OR hatedUserId = ?',
      [userId, userId],
    );

    const data = rows.map((v) => {
      return v.hatingUserId === userId ? v.hatedUserId : v.hatingUserId;
    });

    return { data: [...new Set(data)] };
  }

  //?-------------------------------------------------------------------------//
  //? 신고 (Report)
  //?-------------------------------------------------------------------------//

  // 블락한 사용자 리스트에 추가
  async attachUserIdToReportUserPivot(
    userId: number,
    accusedUserId: number,
    message: string | null,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `report_user` (userId, accusedUserId, message) VALUES (?, ?, ?)',
      [userId, accusedUserId, message],
    );
  }

  // 블락한 사용자 리스트에서 삭제
  async detachUserIdFromReportUserPivot(
    userId: number,
    accusedUserId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `report_user` WHERE userId = ? AND accusedUserId = ?',
      [userId, accusedUserId],
    );
  }

  // 내가 신고한 사용자 리스트 ( #todo. verify the logic )
  async getUsersBeingReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportUser>> {
    const queryBuilder = this.reportUserRepository
      .createQueryBuilder('reportUser')
      .innerJoinAndSelect('reportUser.accusedUser', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where({
        userId: userId,
      });

    const config: PaginateConfig<ReportUser> = {
      sortableColumns: ['userId'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['accusedUserId', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 사용자 ids ( #todo. verify the logic )
  async getUserIdsBeingReportedByMe(userId: number): Promise<AnyData> {
    const rows = await this.repository.manager.query(
      'SELECT userId, accusedUserId \
      FROM `report` \
      WHERE userId = ?',
      [userId],
    );

    const data = rows.map((v) => {
      return v.userId === userId ? v.accusedUserId : v.userId;
    });

    return { data: [...new Set(data)] };
  }

  //?-------------------------------------------------------------------------//
  //?  Reaction Pivot
  //?-------------------------------------------------------------------------//

  // 아이템 조회
  async getReaction(userId: number, connectionId: number): Promise<Reaction> {
    try {
      return await this.reactionRepository.findOneOrFail({
        where: { userId, connectionId },
      });
    } catch (e) {
      //? in case of 404
      return new Reaction({
        userId: userId,
        connectionId: connectionId,
        sympathetic: false,
        surprised: false,
        humorous: false,
        sad: false,
        disgust: false,
      });
      this.logger.log(e);
    }
  }

  // 내 리스트
  async getReactions(userId: number, ids: number[]): Promise<Array<Reaction>> {
    try {
      const items = await this.reactionRepository
        .createQueryBuilder()
        .where('connectionId IN (:ids)', { ids: ids })
        .andWhere('userId = :id', { id: userId })
        .getMany();

      return items;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  // 리스트에 추가
  async attachToReactionPivot(
    userId: number,
    connectionId: number,
    emotion: Emotion,
  ): Promise<number> {
    try {
      await this.repository.manager.query(
        `INSERT IGNORE INTO reaction (userId, connectionId, ${emotion}) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE userId = VALUES(userId), connectionId = VALUES(connectionId), ${emotion} = VALUES(${emotion})`,
        [userId, connectionId, true],
      );
    } catch (e) {
      this.logger.log(e);
    }
    const [row] = await this.repository.manager.query(
      `SELECT COUNT(*) AS cnt FROM reaction WHERE connectionId = ? AND ${emotion} = ?`,
      [connectionId, true],
    );
    const count = row ? +row[`cnt`] : 0;
    const queryString = `UPDATE connection SET ${emotion}Count = ? WHERE id = ?`;
    await this.repository.manager.query(queryString, [count, connectionId]);

    return count;
  }

  // 리스트에서 삭제
  async detachFromReactionPivot(
    userId: number,
    connectionId: number,
    emotion: string,
  ): Promise<number> {
    try {
      await this.repository.manager.query(
        `UPDATE reaction SET ${emotion} = ? WHERE userId = ? AND connectionId = ?`,
        [false, userId, connectionId],
      );
    } catch (e) {
      this.logger.log(e);
    }
    const [row] = await this.repository.manager.query(
      `SELECT COUNT(*) AS cnt FROM reaction WHERE connectionId = ? AND ${emotion} = ?`,
      [connectionId, true],
    );
    const count = row ? +row[`cnt`] : 0;
    const queryString = `UPDATE connection SET ${emotion}Count = ? WHERE id = ?`;
    await this.repository.manager.query(queryString, [count, connectionId]);

    return count;
  }

  //?-------------------------------------------------------------------------//
  //? ReportConnection Pivot
  //?-------------------------------------------------------------------------//

  // 발견 블락 리스트에 추가
  async attachToReportConnectionPivot(
    userId: number,
    connectionId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `report_connection` (userId, connectionId, message) VALUES (?, ?, ?)',
      [userId, connectionId, message],
    );
    if (affectedRows > 0) {
      await this.connectionRepository.increment(
        { id: connectionId },
        'reportCount',
        1,
      );
    }
  }

  // 발견 블락 리스트에서 삭제
  async detachFromReportConnectionPivot(
    userId: number,
    connectionId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `report_connection` WHERE userId = ? AND connectionId = ?',
      [userId, connectionId],
    );
    if (affectedRows > 0) {
      // await this.connectionRrepository.decrement({ connectionId }, 'ReportConnectionCount', 1);
      await this.repository.manager.query(
        'UPDATE `connection` SET reportCount = reportCount - 1 WHERE id = ? AND reportCount > 0',
        [connectionId],
      );
    }
  }

  // 내가 블락한 발견 리스트
  async getConnectionsReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportConnection>> {
    const queryBuilder = this.reportConnectionRepository
      .createQueryBuilder('report_connection')
      .leftJoinAndSelect('report_connection.connection', 'connection')
      .leftJoinAndSelect('connection.dot', 'dot')
      .where({
        userId,
      });

    const config: PaginateConfig<ReportConnection> = {
      sortableColumns: ['connectionId'],
      searchableColumns: ['connection.answer'],
      defaultLimit: 20,
      defaultSortBy: [['connectionId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 블락한 발견 ID 리스트
  async getConnectionIdsReportedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT connectionId \
      FROM `user` INNER JOIN `report_connection` ON `user`.id = `report_connection`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return {
      data: items.map(({ connectionId }) => connectionId),
    };
  }

  //?-------------------------------------------------------------------------//
  //? Like Pivot
  //?-------------------------------------------------------------------------//

  // 찜 리스트에 추가
  async attachToLikePivot(userId: number, meetupId: number): Promise<any> {
    const [row] = await this.repository.query(
      'SELECT COUNT(*) AS cnt FROM `like` WHERE userId = ?',
      [userId],
    );
    const count = row.cnt;
    if (+count > 30) {
      throw new NotAcceptableException('reached maximum count');
    }

    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `like` (userId, meetupId) VALUES (?, ?)',
      [userId, meetupId],
    );

    if (affectedRows > 0) {
      await this.meetupRepository.increment({ id: meetupId }, 'likeCount', 1);
    }
  }

  // 찜 리스트에서 삭제
  async detachFromLikePivot(userId: number, meetupId: number): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `like` WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      // the following doesn't work at times.
      // await this.meetupRrepository.decrement({ meetupId }, 'likeCount', 1);
      //
      // we need to make the likeCount always positive.
      await this.repository.manager.query(
        'UPDATE `meetup` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
        [meetupId],
      );
    }
  }

  // 내가 찜한 모임 리스트
  async getMeetupsLikedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Like>> {
    const queryBuilder = this.likeRepository
      .createQueryBuilder('like')
      .innerJoinAndSelect('like.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        userId,
      });

    const config: PaginateConfig<Like> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 찜한 모임 ID 리스트
  async getMeetupIdsLikedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `like` ON `user`.id = `like`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  //?-------------------------------------------------------------------------//
  //? Report Meetup Pivot
  //?-------------------------------------------------------------------------//

  // 모임 블락 리스트에 추가
  async attachToReportMeetupPivot(
    userId: number,
    meetupId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `report_meetup` (userId, meetupId, message) VALUES (?, ?, ?)',
      [userId, meetupId, message],
    );
    if (affectedRows > 0) {
      await this.meetupRepository.increment({ id: meetupId }, 'reportCount', 1);
    }
  }

  // 모임 블락 리스트에서 삭제
  async detachFromReportMeetupPivot(
    userId: number,
    meetupId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `report_meetup` WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      // await this.meetupRrepository.decrement({ meetupId }, 'reportCount', 1);
      await this.repository.manager.query(
        'UPDATE `meetup` SET reportCount = reportCount - 1 WHERE id = ? AND reportCount > 0',
        [meetupId],
      );
    }
  }

  // 내가 블락한 모임 리스트
  async getMeetupsReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportMeetup>> {
    const queryBuilder = this.reportMeetupRepository
      .createQueryBuilder('reportMeetup')
      .leftJoinAndSelect('reportMeetup.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .where({
        userId,
      });

    const config: PaginateConfig<ReportMeetup> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 블락한 모임 ID 리스트
  async getMeetupIdsReportedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `report_meetup` ON `user`.id = `report_meetup`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  //?-------------------------------------------------------------------------//
  //? Join Pivot
  //?-------------------------------------------------------------------------//

  // 신청리스트에 추가
  async attachToJoinPivot(
    askingUserId: number,
    askedUserId: number,
    meetupId: number,
    dto: CreateJoinDto,
  ): Promise<Meetup> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: meetupId },
      relations: ['joins'],
    });

    let joinType = JoinType.REQUEST;
    if (meetup.userId == askedUserId) {
      // 1. 방장에게 신청하는 경우, 30명 까지로 제한.
      if (
        meetup.joins.filter((v) => meetup.userId === v.askedUserId).length > 30
      ) {
        throw new NotAcceptableException('reached maximum count');
      }
      // await this.attachToLikePivot(askingUserId, meetupId);
    } else {
      // 2. 방장이 초대하는 경우, 갯수 제한 없음.
      joinType = JoinType.INVITATION;
    }

    try {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `join` (askingUserId, askedUserId, meetupId, message, skill, joinType) VALUES (?, ?, ?, ?, ?, ?)',
        [askingUserId, askedUserId, meetupId, dto.message, dto.skill, joinType],
      );
      return meetup;
    } catch (e) {
      throw new BadRequestException('database has gone crazy.');
    }
  }

  // 매치신청 승인/거부
  async updateJoinToAcceptOrDeny(
    askingUserId: number,
    askedUserId: number,
    meetupId: number,
    status: JoinStatus,
    joinType: JoinType,
  ): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `join` SET status = ? WHERE askingUserId = ? AND askedUserId = ? AND meetupId = ?',
      [status, askingUserId, askedUserId, meetupId],
    );

    //? room record 생성
    if (status === JoinStatus.ACCEPTED) {
      if (joinType === JoinType.REQUEST) {
        // 모임 신청 (add askingUserId to `room`)
        await this.repository.manager.query(
          'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
          ['guest', askingUserId, meetupId],
        );
      } else {
        // 모임 초대 (add askedUserId to `room`)
        await this.repository.manager.query(
          'INSERT IGNORE INTO `room` (partyType, userId, meetupId) VALUES (?, ?, ?)',
          ['guest', askedUserId, meetupId],
        );
      }

      const [{ max }] = await this.repository.manager.query(
        'SELECT max FROM `meetup` WHERE id = ?',
        [meetupId],
      );
      const [{ count }] = await this.repository.manager.query(
        'SELECT COUNT(*) AS count FROM `room` WHERE meetupId = ?',
        [meetupId],
      );

      if (max >= +count) {
        await this.repository.manager.query(
          'UPDATE `meetup` SET isFull = 1 WHERE id = ?',
          [meetupId],
        );
      }
    }
  }

  //? 신청(request)한 모임 리스트
  async getMeetupsRequested(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .innerJoinAndSelect('join.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        joinType: JoinType.REQUEST,
        askingUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //? 신청(request)한 모임ID 리스트
  async getMeetupIdsRequested(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId FROM `join` \
INNER JOIN `user` ON `user`.id = `join`.askingUserId \
INNER JOIN `meetup` ON `meetup`.id = `join`.meetupId \
WHERE `joinType` = ? AND `user`.id = ?',
      [JoinType.REQUEST, userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  //? 초대(invitation)받은 모임 리스트
  async getMeetupsInvited(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .innerJoinAndSelect('join.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
      .where({
        joinType: JoinType.INVITATION,
        askedUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //? 나를 초대한 모임ID 리스트
  async getMeetupIdsInvited(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId FROM `join` \
INNER JOIN `user` ON `user`.id = `join`.askedUserId \
INNER JOIN `meetup` ON `meetup`.id = `join`.meetupId \
WHERE `joinType` = ? AND `user`.id = ?',
      [JoinType.INVITATION, userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  //! 내가 신청한 사용자 리스트 (deprecated at the moment) : askedUser 나 meetup.user 나 동일하다.
  async getUsersRequested(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .innerJoinAndSelect('join.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where({
        joinType: JoinType.REQUEST,
        askingUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //! 나를 초대한 사용자 리스트 (deprecated at the moment) : askingUser 나 meetup.user 나 동일하다.
  async getUsersInvited(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .innerJoinAndSelect('join.meetup', 'meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('join.askingUser', 'askingUser')
      .leftJoinAndSelect('askingUser.profile', 'askingUserProfile')
      // .leftJoinAndSelect('join.askedUser', 'askedUser')
      // .leftJoinAndSelect('askedUser.profile', 'askedUserProfile')
      .where({
        joinType: JoinType.INVITATION,
        askedUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? friendship
  //?-------------------------------------------------------------------------//

  // 친구신청 리스트에 추가
  async attachToFriendshipPivot(
    senderId: number,
    recipientId: number,
    message = '친구 신청합니다.',
  ): Promise<void> {
    // check if the recipient exists
    await this.repository.findOneOrFail({
      where: { id: recipientId },
    });

    try {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `friendship` (senderId, recipientId, message) VALUES (?, ?, ?)',
        [senderId, recipientId, message],
      );
    } catch (e) {
      throw new BadRequestException('database has gone crazy.');
    }
  }

  // 친구신청 승인/거부
  async updateFriendshipWithStatus(
    senderId: number,
    recipientId: number,
    status: JoinStatus,
  ): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `friendship` SET status = ? WHERE senderId = ? AND recipientId = ?',
      [status, senderId, recipientId],
    );
  }

  // 신청(request)한 예비친구 리스트
  async getFriendshipSenders(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.sender', 'sender')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .where({
        joinStatus: JoinStatus.ACCEPTED,
        recipientId: userId,
      });

    const config: PaginateConfig<Friendship> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 신청(request)한 예비친구 리스트
  async getFriendshipRecipients(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.sender', 'sender')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .where({
        joinStatus: JoinStatus.ACCEPTED,
        senderId: userId,
      });

    const config: PaginateConfig<Friendship> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? 신한운세
  //?-------------------------------------------------------------------------//

  // 올해의 운세보기
  async askYearly(dto: YearlyFortuneDto): Promise<any> {
    return await this.crawlerService.askYearly(dto);
  }

  // 오늘의 운세보기
  async askDaily(dto: DailyFortuneDto): Promise<any> {
    return await this.crawlerService.askDaily(dto);
  }

  // 궁합보기
  async askLove(dto: LoveFortuneDto): Promise<any> {
    return await this.crawlerService.askLove(dto);
  }
}
