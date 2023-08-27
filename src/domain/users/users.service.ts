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
import { Status } from 'src/common/enums/status';
import { AnyData, SignedUrl } from 'src/common/types';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune.dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune.dto';
import { randomName } from 'src/helpers/random-filename';
import { getUsername } from 'src/helpers/random-username';
import { S3Service } from 'src/services/aws/s3.service';
import { CrawlerService } from 'src/services/crawler/crawler.service';
import { FindOneOptions, In } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Dislike } from 'src/domain/meetups/entities/dislike.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { AWS_SES_CONNECTION } from 'src/common/constants';
import { SES } from 'aws-sdk';
import { ChangeUsernameDto } from 'src/domain/users/dto/change-username.dto';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { Interest } from 'src/domain/meetups/entities/interest.entity';
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
    @InjectRepository(Secret)
    private readonly secretRepository: Repository<Secret>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Dislike)
    private readonly dislikeRepository: Repository<Dislike>,
    @InjectRepository(Join)
    private readonly joinRepository: Repository<Join>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    @Inject(SmsClient) private readonly smsClient: SmsClient, // naver
    @Inject(AWS_SES_CONNECTION) private readonly ses: SES,
    private readonly s3Service: S3Service,
    private readonly crawlerService: CrawlerService,
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // [관리자] User 생성
  async create(dto: CreateUserDto): Promise<User> {
    const user = await this.repository.save(this.repository.create(dto));
    if (user.username) {
      return user;
    }
    const username = getUsername(user.id);
    return this.update(user.id, { username });
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

  // User 닉네임 갱신
  async changeUsername(id: number, dto: ChangeUsernameDto): Promise<User> {
    const assignedUsername = getUsername(id);
    const user = await this.findById(id);
    if (assignedUsername != user.username) {
      throw new ForbiddenException('already updated username');
    }
    user.username = dto.username;
    return await this.repository.save(user);
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
    console.log(user);

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
      console.log(e);
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
      await this._sendEmailTemplateTo(phone, otp);
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
      await this._sendEmailTemplateTo(val, otp);
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

  async _sendEmailTemplateTo(email: string, otp: string): Promise<any> {
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      Source: 'MeSo <no-reply@meetsocrates.kr>',
      Template: 'EmailCodeTemplate',
      TemplateData: `{ "code": "${otp}" }`,
    };
    try {
      return await this.ses.sendTemplatedEmail(params).promise();
    } catch (e) {
      console.log(e);
      throw new BadRequestException('aws-ses error');
    }
  }

  async _sendEmailTo(email: string, message: string): Promise<any> {
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: 'UTF-8',
            Data: `<h1>${message}</h1>`,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `${message}\n`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Test email',
        },
      },
      Source: 'MeSo <no-reply@meetsocrates.kr>',
      // ReplyToAddresses: ['chuck@fleaauction.co'],
    };

    return await this.ses.sendEmail(params).promise();
  }

  //?-------------------------------------------------------------------------//
  //? Some Extra shit
  //?-------------------------------------------------------------------------//

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async increasePayCount(id: number): Promise<void> {
    await this.profileRepository
      .createQueryBuilder()
      .update(Profile)
      .set({ payCount: () => 'payCount + 1' })
      .where('userId = :id', { id })
      .execute();
  }

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async decreasePayCount(id: number): Promise<void> {
    await this.profileRepository
      .createQueryBuilder()
      .update(Profile)
      .set({ payCount: () => 'payCount - 1' })
      .where('userId = :id', { id })
      .execute();
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
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('meetup.joins', 'join')
      .leftJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('join.askingUser', 'askingUser')
      .leftJoinAndSelect('join.askedUser', 'askedUser')
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
  //? 관심사 Categories
  //?-------------------------------------------------------------------------//

  // 나의 관심사 리스트
  async getCategories(id: number): Promise<Array<Category>> {
    const user = await this.repository.findOneOrFail({
      where: {
        id: id,
      },
      relations: ['categoriesInteresting', 'categoriesInteresting.category'],
    });

    return user.categoriesInteresting.map(
      (v) =>
        new Category({
          id: v.category.id,
          slug: v.category.slug,
          depth: v.skill,
        }),
    );
  }

  // 나의 관심사 리스트에 추가
  async syncCategoriesWithIds(
    id: number,
    ids: number[],
  ): Promise<Array<Category>> {
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

  // 나의 관심사 리스트에 추가
  async syncCategoriesWithSlugs(
    id: number,
    slugs: string[],
  ): Promise<Array<Category>> {
    const categories = await this.categoryRepository.findBy({
      slug: In(slugs),
    });
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
  async addCategoryWithSkill(
    id: number,
    slug: string,
    skill: number,
  ): Promise<Array<Category>> {
    const category = await this.categoryRepository.findOneBy({
      slug: slug,
    });
    if (category !== null) {
      await this.repository.manager.query(
        'INSERT INTO `interest` (userId, categoryId, skill) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE userId = VALUES(`userId`), categoryId = VALUES(`categoryId`), skill = VALUES(`skill`)',
        [id, category.id, skill],
      );
    }
    return await this.getCategories(id);
  }

  // 나의 관심사 리스트에서 삭제
  async removeCategories(id: number, ids: number[]): Promise<Array<Category>> {
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

  // 사용자 블락 리스트에 추가
  async attachToHatePivot(
    hatingUserId: number,
    hatedUserId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `hate` (hatingUserId, hatedUserId, message) VALUES (?, ?, ?)',
      [hatingUserId, hatedUserId, message],
    );

    if (affectedRows > 0) {
      //
      // 대상회원이 만든 모임의 차단처리
      //
      const meetups = await this.meetupRepository.find({
        select: {
          id: true,
        },
        where: {
          userId: hatedUserId,
        },
      });
      await Promise.all(
        meetups.map(async (v) => {
          await this.repository.manager.query(
            'INSERT IGNORE INTO `dislike` (userId, meetupId, message) VALUES (?, ?, ?)',
            [hatingUserId, v.id, `${hatingUserId} hates ${hatedUserId}`],
          );
        }),
      );
    }
  }

  // 사용자 블락 리스트에서 삭제
  async detachFromHatePivot(
    hatingUserId: number,
    hatedUserId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `hate` WHERE hatingUserId = ? AND hatedUserId = ?',
      [hatingUserId, hatedUserId],
    );

    if (affectedRows > 0) {
      //
      // 대상회원이 만든 모임의 차단처리 취소
      //
      const meetups = await this.meetupRepository.find({
        select: {
          id: true,
        },
        where: {
          userId: hatedUserId,
        },
      });

      const ids = meetups.map((v) => v.id);
      await this.repository.manager.query(
        'DELETE FROM `dislike` WHERE userId = ? AND meetupId IN (?)',
        [hatingUserId, ids],
      );
    }
  }

  // 내가 블락하거나 나를 블락한 ids
  async getUserIdsHatedByMe(userId: number): Promise<AnyData> {
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
  //? Like Pivot
  //?-------------------------------------------------------------------------//

  // 찜 리스트에 추가
  async attachToLikePivot(userId: number, meetupId: number): Promise<any> {
    const [row] = await this.repository.query(
      'SELECT COUNT(*) AS cnt FROM `like` WHERE userId = ?',
      [userId],
    );
    const count = row.cnt;
    if (+count >= 10) {
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
      .leftJoinAndSelect('like.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
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
  //? Dislike Pivot
  //?-------------------------------------------------------------------------//

  // 모임 블락 리스트에 추가
  async attachToDislikePivot(
    userId: number,
    meetupId: number,
    message: string,
  ): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `dislike` (userId, meetupId, message) VALUES (?, ?, ?)',
      [userId, meetupId, message],
    );
    if (affectedRows > 0) {
      await this.meetupRepository.increment(
        { id: meetupId },
        'dislikeCount',
        1,
      );
    }
  }

  // 모임 블락 리스트에서 삭제
  async detachFromDislikePivot(userId: number, meetupId: number): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `dislike` WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      // await this.meetupRrepository.decrement({ meetupId }, 'dislikeCount', 1);
      await this.repository.manager.query(
        'UPDATE `meetup` SET dislikeCount = dislikeCount - 1 WHERE id = ? AND dislikeCount > 0',
        [meetupId],
      );
    }
  }

  // 내가 블락한 모임 리스트
  async getMeetupsDislikedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Dislike>> {
    const queryBuilder = this.dislikeRepository
      .createQueryBuilder('dislike')
      .leftJoinAndSelect('dislike.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .where({
        userId,
      });

    const config: PaginateConfig<Dislike> = {
      sortableColumns: ['meetupId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['meetupId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 블락한 모임 ID 리스트
  async getMeetupIdsDislikedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `dislike` ON `user`.id = `dislike`.userId \
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
  ): Promise<any> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: meetupId },
      relations: ['joins'],
    });

    if (meetup.userId == askedUserId) {
      // 1. 방장에게 asking 하는 경우, 30명 까지로 제한.
      if (
        meetup.joins.filter((v) => meetup.userId === v.askedUserId).length > 30
      ) {
        throw new NotAcceptableException('reached maximum count');
      }
      // await this.attachToLikePivot(askingUserId, meetupId);
    } else {
      // 2. 방장이 찜한 사람에게 asking 하는 경우, 갯수 제한 없음.
    }

    try {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `join` (askingUserId, askedUserId, meetupId, message, skill) VALUES (?, ?, ?, ?, ?)',
        [askingUserId, askedUserId, meetupId, dto.message, dto.skill],
      );

      // todo. interest table update
    } catch (e) {
      throw new BadRequestException('database has gone crazy.');
    }
  }

  // 매치신청 승인
  async updateJoinToAcceptOrDeny(
    askingUserId: number,
    askedUserId: number,
    meetupId: number,
    status: Status,
  ): Promise<any> {
    await this.repository.manager.query(
      'UPDATE `join` SET status = ? WHERE askingUserId = ? AND askedUserId = ? AND meetupId = ?',
      [status, askingUserId, askedUserId, meetupId],
    );
  }

  // 내가 신청한 모임 리스트
  async getMeetupsAskedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .leftJoinAndSelect('join.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      // .leftJoinAndSelect('join.askedUser', 'askedUser')
      .leftJoinAndSelect('meetup.user', 'user')
      .where({
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

  // 내가 신청한 모임 ID 리스트
  async getMeetupIdsAskedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `join` ON `user`.id = `join`.askingUserId \
      WHERE `user`.id = ?',
      [userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  // 내에게 만나자고 신청한 호구 리스트
  async getUsersAskingMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .leftJoinAndSelect('join.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('join.askingUser', 'askingUser')
      .leftJoinAndSelect('askingUser.profile', 'askingUserProfile')
      // .leftJoinAndSelect('join.askedUser', 'askedUser')
      // .leftJoinAndSelect('askedUser.profile', 'askedUserProfile')
      .where({
        askedUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 만나자고 신청드린 상대방 리스트
  async getUsersAskedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const queryBuilder = this.joinRepository
      .createQueryBuilder('join')
      .leftJoinAndSelect('join.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('join.askedUser', 'askedUser')
      .leftJoinAndSelect('askedUser.profile', 'profile')
      .where({
        askingUserId: userId,
      });

    const config: PaginateConfig<Join> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
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
