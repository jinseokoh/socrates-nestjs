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
import { randomName } from 'src/helpers/random-filename';
import { Repository } from 'typeorm/repository/Repository';
import { S3Service } from 'src/services/aws/s3.service';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { SesService } from 'src/services/aws/ses.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/entities/user.entity';

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
  //? CREATE
  //?-------------------------------------------------------------------------//

  // User 생성
  async create(dto: CreateUserDto): Promise<User> {
    return await this.repository.save(this.repository.create(dto));
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // User 리스트 (paginated)
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
      throw new NotFoundException('user not found');
    }
  }

  // User 상세보기 (w/ unique key)
  async findByUniqueKey(params: FindOneOptions): Promise<User> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // User 갱신
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

  //? User 닉네임 갱신 (비용이 발생할 수 있음)
  //! balance will be adjusted w/ ledger model event subscriber.
  //! using transaction using query runner
  async changeUsername(id: number, dto: ChangeUsernameDto): Promise<number> {
    let newBalance = 0;
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
    await queryRunner.startTransaction();
    try {
      if (count > 0) {
        throw new UnprocessableEntityException(`a taken username`);
      }
      if (!user) {
        throw new NotFoundException(`user not found`);
      }
      if (user?.isBanned) {
        throw new UnprocessableEntityException(`a banned user`);
      }
      if (
        user.profile?.balance === null ||
        user.profile?.balance - dto.costToUpdate < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }
      newBalance = user.profile?.balance - dto.costToUpdate;
      if (dto.costToUpdate > 0) {
        const ledger = new Ledger({
          credit: dto.costToUpdate,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `사용자명 변경요금 (user #${id})`,
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
      await this._deleteComment(id);
      await this._deleteConnection(id);
      await this._deleteFlag(id);
      await this._deleteHate(id);
      await this._deleteInquiry(id);
      await this._deleteJoin(id);
      await this._deleteLanguage(id);
      await this._deleteLedger(id);
      await this._deleteLike(id);
      await this._deleteMeetup(id);
      await this._deletePlea(id);
      await this._deleteProfile(id);
      // await this._deleteProvider(id);
      await this._deleteRemark(id);
      await this._deleteReportConnection(id);
      await this._deleteReportMeetup(id);
      await this._deleteReportUser(id);
      await this._deleteThread(id);
      await this._voidPersonalInformation(id, dto.message ?? '');
      // await this.softRemove(id);
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }

    // this.slack.send(
    //   `[local-test] 다음 사용자가 탈퇴했습니다.\n- 아이디:${id}\n- 이름:${user.username}(실명:${user.realname})\n- 전화:${user.phone}\n- 이메일:${user.email}`,
    // );

    return {
      data: 'ok',
    };
  }

  async _deleteComment(id: number) {
    await this.repository.manager.query(
      'UPDATE `comment` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }
  async _deleteConnection(id: number) {
    await this.repository.manager.query(
      'UPDATE `connection` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }
  async _deleteFlag(id: number) {
    await this.repository.manager.query('DELETE FROM `flag` WHERE userId = ?', [
      id,
    ]);
  }
  async _deleteFriendship(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `friendship` WHERE senderId = ? OR recipientId = ?',
      [id, id],
    );
  }
  async _deleteHate(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `hate` WHERE senderId = ? OR recipientId = ?',
      [id, id],
    );
  }
  async _deleteImpression(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `impression` WHERE userId = ?',
      [id],
    );
  }
  async _deleteInquiry(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `inquiry` WHERE userId = ?',
      [id],
    );
  }
  async _deleteInterest(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `interest` WHERE userId = ?',
      [id],
    );
  }
  async _deleteJoin(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `join` WHERE askingUserId = ? OR askedUserId = ?',
      [id, id],
    );
  }
  async _deleteLanguage(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ?',
      [id],
    );
  }
  async _deleteLedger(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `ledger` WHERE userId = ?',
      [id],
    );
  }
  async _deleteLike(id: number) {
    await this.repository.manager.query('DELETE FROM `like` WHERE userId = ?', [
      id,
    ]);
  }
  async _deleteMeetup(id: number) {
    await this.repository.manager.query(
      'UPDATE `meetup` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }
  async _deletePlea(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `plea` WHERE senderId = ? OR recipientId = ?',
      [id, id],
    );
  }
  async _deleteProfile(id: number) {
    await this.repository.manager.query(
      'UPDATE `profile` SET balance=0, bio=NULL, mbti=NULL, region=NULL, occupation=NULL, education=NULL,fyis=NULL,images=NULL WHERE userId = ?',
      [id],
    );
  }
  async _deleteProvider(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `provider` WHERE userId = ?',
      [id],
    );
  }
  async _deleteReaction(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `reaction` WHERE userId = ?',
      [id],
    );
  }
  async _deleteRemark(id: number) {
    await this.repository.manager.query(
      'UPDATE `remark` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }
  async _deleteReportConnection(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `report_connection` WHERE userId = ?',
      [id],
    );
  }
  async _deleteReportMeetup(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `report_meetup` WHERE userId = ?',
      [id],
    );
  }
  async _deleteReportUser(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `report_user` WHERE userId = ? OR accusedUserId = ?',
      [id, id],
    );
  }
  async _deleteThread(id: number) {
    await this.repository.manager.query(
      'UPDATE `thread` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }

  async _voidPersonalInformation(id: number, message: string): Promise<any> {
    const user = await this.findById(id);

    const realname =
      user.realname && user.realname.length > 1
        ? user.realname.slice(0, -1) + '*'
        : `n/a`;
    const email = user.email.replace(/@/g, 'at').replace(/\./g, 'dot');
    const phone = user.phone && user.phone.length > 4 ? user.phone : '---n/a';
    const dob = moment(user.dob).startOf('year').tz('Asia/Seoul').toDate();
    user.username = `탈퇴회원(${user.username})`;
    user.email = `- ${email}`;
    user.phone = `- ${phone.substring(3)}`;
    user.realname = `- ${realname}`;
    user.dob = dob;
    await this.repository.save(user);

    await this.repository.manager.query(
      'UPDATE `user` SET password=?,career=NULL,avatar=NULL,pushToken=NULL,refreshTokenHash=NULL,isActive=0 WHERE id = ?',
      [message, id],
    );
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // User 프로필사진 갱신
  async upload(id: number, file: Express.Multer.File): Promise<User> {
    await this.findById(id);
    const path = `local/users/${id}/${randomName('avatar')}`;
    try {
      // image processing w/ Jimp and upload the result image to s3
      await this.s3Service.uploadWithResizing(file, path, 640);
    } catch (e) {
      this.logger.log(e);
    }
    const avatar = `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
    return this.update(id, { avatar });
  }

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomName(dto.name ?? 'avatar', dto.mimeType);
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
      throw new BadRequestException('nCloud smsClient error');
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
  //? 첫인상
  //?-------------------------------------------------------------------------//

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
        // const dto = new UpdateProfileDto();
        // dto.impressions = impressions;
        // await this.updateProfile(id, dto);
        return impressions;
      } else {
        return [];
      }
    } catch (e) {
      this.logger.log(e);
      throw new BadRequestException();
    }
  }

  // 첫인상 평균 보기 (w/ id)
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
}
