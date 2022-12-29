import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
import { UpdateProfileDto } from 'src/domain/profiles/dto/update-profile.dto';
import { Profile } from 'src/domain/profiles/profile.entity';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { YearlyInputDto } from 'src/domain/users/dto/yearly-input-dto';
import { User } from 'src/domain/users/user.entity';
import { randomName } from 'src/helpers/random-filename';
import { getUsername } from 'src/helpers/random-username';
import { S3Service } from 'src/services/aws/s3.service';
import { CrawlerService } from 'src/services/crawler/crawler.service';
import { FindOneOptions } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class UsersService {
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
    const user = this.repository.create(dto);
    const dbUser = await this.repository.save(user);
    if (dbUser.username) {
      return dbUser;
    }
    const username = getUsername(dbUser.id);
    return this.update(dbUser.id, { username });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // 올해의 운세보기
  async askYearly(dto: YearlyInputDto): Promise<any> {
    return await this.crawlerService.askYearly(dto);
  }

  // 오늘의 운세보기
  async askDaily(params: any): Promise<any> {
    return await this.crawlerService.askDaily(params);
  }

  // 운세보기
  async askLove(params: any): Promise<any> {
    return await this.crawlerService.askLove(params);
  }

  // 역술사주팔자
  async askYuksul(params: any): Promise<any> {
    return await this.crawlerService.askYuksul(params);
  }

  // User 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.artist', 'artist')
      .loadRelationCountAndMap('user.artworkCount', 'user.artworks');

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
      await user.save();
      // soft deletion
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

  //--------------------------------------------------------------------------//
  // Some private shit
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
}
