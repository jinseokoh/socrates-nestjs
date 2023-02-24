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
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
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
    const count = await this.repository.count();
    const username = getUsername(count);
    return this.update(user.id, { username });
  }

  //?-------------------------------------------------------------------------//
  //? READ
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
    id: string,
    relations: string[] = [],
  ): Promise<User> {
    console.log(id);
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
  async findById(id: string, relations: string[] = []): Promise<User> {
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
  async updateExtended(id: string, body: any): Promise<User> {
    console.log(body, '~~ body');

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
  async update(id: string, dto: UpdateUserDto): Promise<User> {
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
  async upload(id: string, file: Express.Multer.File): Promise<User> {
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
  async changePassword(id: string, dto: ChangePasswordDto): Promise<User> {
    const user = await this.findById(id);
    const passwordMatches = await bcrypt.compare(dto.current, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('invalid credentials');
    }
    user.password = dto.password;
    return await this.repository.save(user);
  }

  // User 와 연계된 Profile 갱신
  async updateProfile(id: string, dto: UpdateProfileDto): Promise<Profile> {
    const user = await this.findById(id, ['profile']);
    const profileId = user.profile.id;

    const profile = await this.profileRepository.preload({
      id: profileId,
      ...dto,
    });
    return await this.profileRepository.save(profile);
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: string): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.softRemove(user);
  }

  async remove(id: string): Promise<User> {
    const user = await this.findById(id);
    return await this.repository.remove(user);
  }

  // User 탈퇴
  async quit(id: string, dto: DeleteUserDto): Promise<any> {
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

  // 사용자 s3 파일 삭제
  async deleteS3file(url: string) {
    if (url === 'https://cdn.fleaauction.world/images/user.png') {
      return;
    }

    try {
      await this.s3Service.delete(url);
      return { data: { url } };
    } catch (e) {
      console.log(url, e, 'dang... s3 failed?');
    }
  }

  //--------------------------------------------------------------------------//
  // Some extra shit
  //--------------------------------------------------------------------------//

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async increasePayCount(id: string): Promise<void> {
    await this.profileRepository
      .createQueryBuilder()
      .update(Profile)
      .set({ payCount: () => 'payCount + 1' })
      .where('userId = :id', { id })
      .execute();
  }

  // todo refactor) this responsibility belongs to Profile. (priority: low)
  async decreasePayCount(id: string): Promise<void> {
    await this.profileRepository
      .createQueryBuilder()
      .update(Profile)
      .set({ payCount: () => 'payCount - 1' })
      .where('userId = :id', { id })
      .execute();
  }

  //--------------------------------------------------------------------------//
  // Some private shit
  //--------------------------------------------------------------------------//

  async _hardRemovalOnFollow(id: string) {
    await this.repository.manager.query(
      'DELETE FROM follow WHERE followingId = ? OR followerId = ?',
      [id, id],
    );
  }

  async _voidPersonalInformation(id: string): Promise<any> {
    const user = await this.findById(id);
    const email = user.email;
    const phone = user.phone;
    user.email = `${email}.deleted`;
    user.phone = `---${phone.substring(3)}`;
    await this.repository.save(user);
  }
}
