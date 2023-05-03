import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Status } from 'src/common/enums/status';
import { AnyData } from 'src/common/types';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { MeetupUser } from 'src/domain/meetups/entities/meetup-user.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune-dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune-dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune-dto';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { randomName } from 'src/helpers/random-filename';
import { getUsername } from 'src/helpers/random-username';
import { S3Service } from 'src/services/aws/s3.service';
import { CrawlerService } from 'src/services/crawler/crawler.service';
import { FindOneOptions } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(MeetupUser)
    private readonly meetupUserRepository: Repository<MeetupUser>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly crawlerService: CrawlerService,
    private readonly s3Service: S3Service,
  ) {}

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
    const dbUser = await this.findById(id);
    if (dto.usernamedAt && dbUser.usernamedAt) {
      const oldDate = moment(dbUser.usernamedAt);
      const newDate = moment(dto.usernamedAt);
      const diffInDays = newDate.diff(oldDate, 'days');
      if (diffInDays < 20) {
        throw new BadRequestException(`${20 - diffInDays} days remain`);
      }
    }

    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

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

  // 내가 만든 Meetup 리스트
  async getUserMeetups(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .where({
        userId,
      });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['createdAt', 'expiredAt'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        career: [FilterOperator.EQ, FilterOperator.IN],
        gender: [FilterOperator.EQ, FilterOperator.IN],
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
      .leftJoinAndSelect('meetup.venue', 'venue')
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
        career: [FilterOperator.EQ, FilterOperator.IN],
        gender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? MeetupUser Pivot
  //?-------------------------------------------------------------------------//

  // 찜 리스트에 추가
  async attachToMeetupUserPivot(
    userId: number,
    meetupId: string,
  ): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `meetup_user` (userId, meetupId) VALUES (?, ?)',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      await this.meetupRepository.increment({ id: meetupId }, 'faveCount', 1);
    }
  }

  // 찜 리스트에서 삭제
  async detachFromMeetupUserPivot(
    userId: number,
    meetupId: string,
  ): Promise<any> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `meetup_user` WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    if (affectedRows > 0) {
      // await this.meetupRrepository.decrement({ meetupId }, 'faveCount', 1);
      await this.repository.manager.query(
        'UPDATE `meetup` SET faveCount = faveCount - 1 WHERE id = ? AND faveCount > 0',
        [meetupId],
      );
    }
  }

  // 내가 찜한 모임 리스트
  async getMeetupsLikedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<MeetupUser>> {
    const queryBuilder = this.meetupUserRepository
      .createQueryBuilder('meetupUser')
      .leftJoinAndSelect('meetupUser.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .where({
        userId,
      });

    const config: PaginateConfig<MeetupUser> = {
      sortableColumns: ['userId'],
      searchableColumns: ['meetup.title'],
      defaultLimit: 20,
      defaultSortBy: [['userId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 찜한 모임 ID 리스트
  async getMeetupIdsLikedByMe(userId: number): Promise<AnyData> {
    const items = await this.repository.manager.query(
      'SELECT meetupId \
      FROM `user` INNER JOIN `meetup_user` ON `user`.id = `meetup_user`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return {
      data: items.map(({ meetupId }) => meetupId),
    };
  }

  //?-------------------------------------------------------------------------//
  //? Match Pivot
  //?-------------------------------------------------------------------------//

  // 신청리스트에 추가
  async attachToMatchPivot(
    askingUserId: number,
    askedUserId: number,
    meetupId: string,
  ): Promise<any> {
    const meetup = await this.meetupRepository.findOneOrFail({
      where: { id: meetupId },
    });
    if (meetup.userId == askedUserId) {
      // 찜한 사람이 방장에게 asking
      // to make sure if this meetup is on the asking user's likes list
      await this.attachToMeetupUserPivot(askingUserId, meetupId);
    } else {
      // 방장이 찜한 사람에게 asking
    }

    await this.repository.manager.query(
      'INSERT IGNORE INTO `match` (askingUserId, askedUserId, meetupId) VALUES (?, ?, ?)',
      [askingUserId, askedUserId, meetupId],
    );
  }

  // 매치신청 승인
  async updateMatchToAcceptOrDeny(
    askingUserId: number,
    askedUserId: number,
    meetupId: string,
    status: Status,
  ): Promise<any> {
    await this.repository.manager.query(
      'UPDATE `match` SET status = ? WHERE askingUserId = ? AND askedUserId = ? AND meetupId = ?',
      [status, askingUserId, askedUserId, meetupId],
    );
  }

  // 내에게 만나자고 신청한 호구 리스트
  async getUsersAskingMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Match>> {
    const queryBuilder = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('match.askingUser', 'askingUser')
      .leftJoinAndSelect('askingUser.profile', 'profile')
      .where({
        askedUserId: userId,
      });

    const config: PaginateConfig<Match> = {
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
  ): Promise<Paginated<Match>> {
    const queryBuilder = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.meetup', 'meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('match.askedUser', 'askedUser')
      .leftJoinAndSelect('askedUser.profile', 'profile')
      .where({
        askingUserId: userId,
      });

    const config: PaginateConfig<Match> = {
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
