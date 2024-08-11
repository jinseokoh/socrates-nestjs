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
import * as random from 'randomstring';
import * as moment from 'moment';
import 'moment-timezone';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { LedgerType } from 'src/common/enums';
import { SignedUrl } from 'src/common/types';
import { DataSource, FindOneOptions, In } from 'typeorm';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { ChangeUsernameDto } from 'src/domain/users/dto/change-username.dto';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { randomImageName, randomName } from 'src/helpers/random-filename';
import { Repository } from 'typeorm/repository/Repository';
import { S3Service } from 'src/services/aws/s3.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { PurchaseCoinDto } from 'src/domain/users/dto/purchase-coin.dto';

@Injectable()
export class UsersService {
  private readonly env: any;
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private readonly s3Service: S3Service,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  // User 생성
  async create(dto: CreateUserDto): Promise<User> {
    return await this.repository.save(this.repository.create(dto));
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  // User 리스트 (paginated)
  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<User> = {
      sortableColumns: ['id', 'username', 'updatedAt'],
      searchableColumns: ['email', 'username'],
      defaultLimit: 20,
      defaultSortBy: [['updatedAt', 'DESC']],
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

  // User 상세보기 (w/ providerId)
  async findByProviderId(providerId: string): Promise<User> {
    try {
      return await this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('user.providers', 'providers')
        .where('providers.providerName = "firebase"')
        .andWhere('providers.providerId = :providerId', { providerId })
        .getOneOrFail();
    } catch (e) {
      throw new NotFoundException('user not found');
    }
  }

  // User 상세보기 (w/ unique key)
  async findByUniqueKey(params: FindOneOptions): Promise<User> {
    return await this.repository.findOne(params);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  // User 갱신
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

  //? User 닉네임 갱신 (비용이 발생할 수 있음)
  //! balance will be adjusted w/ ledger model event subscriber.
  //! using transaction using query runner
  async changeUsername(id: number, dto: ChangeUsernameDto): Promise<User> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    // let newBalance = 0;
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const count = await queryRunner.manager.count(User, {
        where: { username: dto.username },
      });
      const user = await queryRunner.manager.findOne(User, {
        where: { id: id },
        relations: [`profile`],
      });
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

      const newBalance = user.profile?.balance - dto.costToUpdate;
      user.profile.balance = newBalance;

      if (dto.costToUpdate > 0) {
        const ledger = new Ledger({
          credit: dto.costToUpdate,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `사용자명 변경`,
          userId: id,
        });
        await queryRunner.manager.save(ledger);
      }
      user.username = dto.username;

      await queryRunner.manager.save(user);
      // commit transaction now:
      await queryRunner.commitTransaction();

      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

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
      await this._deleteInquiryComment(id);
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
      await this._deleteProvider(id);
      await this._deleteFeedComment(id);
      await this._deleteReportUserFeed(id);
      await this._deleteReportUserMeetup(id);
      await this._deleteReportUserUser(id);
      await this._deleteMeetupComment(id);
      await this._voidPersonalInformationAndUpsertWithdrawals(
        id,
        dto.message ?? '',
      );
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

  async _deleteInquiryComment(id: number) {
    await this.repository.manager.query(
      'UPDATE `opinion` SET deletedAt=NOW() WHERE userId = ?',
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
      'DELETE FROM `friendship` WHERE userId = ? OR recipientId = ?',
      [id, id],
    );
  }
  async _deleteHate(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `hate` WHERE userId = ? OR recipientId = ?',
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
      'DELETE FROM `join` WHERE userId = ? OR recipientId = ?',
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
      'DELETE FROM `plea` WHERE userId = ? OR recipientId = ?',
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
  async _deleteFeedComment(id: number) {
    await this.repository.manager.query(
      'UPDATE `comment` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }
  async _deleteReportUserFeed(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `report_connection` WHERE userId = ?',
      [id],
    );
  }
  async _deleteReportUserMeetup(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `user_meetup_report` WHERE userId = ?',
      [id],
    );
  }
  async _deleteReportUserUser(id: number) {
    await this.repository.manager.query(
      'DELETE FROM `user_user_report` WHERE userId = ? OR accusedUserId = ?',
      [id, id],
    );
  }
  async _deleteMeetupComment(id: number) {
    await this.repository.manager.query(
      'UPDATE `thread` SET deletedAt=NOW() WHERE userId = ?',
      [id],
    );
  }

  async _voidPersonalInformationAndUpsertWithdrawals(
    id: number,
    message: string,
  ): Promise<any> {
    const user = await this.findById(id, ['providers']);
    const realname =
      user.realname && user.realname.length > 1
        ? user.realname.slice(0, -1) + '*'
        : `n/a`;
    const email = user.email.replace(/@/g, '*').replace(/\./g, ':');
    const phone =
      user.phone && user.phone.length > 4 ? user.phone.substring(3) : 'n/a';
    const postfix = random.generate({ length: 5, charset: 'numeric' });

    user.username = `${user.username}(탈퇴)`; // unique key
    user.email = `${email}:${postfix}`; // unique key
    user.phone = `${phone}:${postfix}`; // unique key
    user.realname = `${realname}`;
    user.dob = moment(user.dob).startOf('year').tz('Asia/Seoul').toDate();
    await this.repository.save(user);
    await this.repository.manager.query(
      'UPDATE `user` SET password=NULL,career=NULL,avatar=NULL,pushToken=NULL,refreshTokenHash=NULL,isActive=0 WHERE id = ?',
      [id],
    );

    // add a withdrawal entry
    await Promise.all(
      user.providers.map(async (v: Provider) => {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `withdrawal` (userId, providerId, reason) VALUES (?, ?, ?) \
ON DUPLICATE KEY UPDATE \
userId = VALUES(`userId`), \
providerId = VALUES(`providerId`), \
reason = VALUES(`reason`)',
          [v.providerId, message, id],
        );
      }),
    );
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  //! @deprecated
  //! compression 은 client side 에서 실행
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
    const fileUri = randomImageName(dto.name ?? 'avatar', dto.mimeType);
    const path = `${process.env.NODE_ENV}/avatars/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }

  //? ----------------------------------------------------------------------- //
  //? Payments
  //? ----------------------------------------------------------------------- //

  //? 코인 구매
  //! balance will be adjusted w/ ledger model event subscriber.
  //! using transaction using query runner
  async purchaseCoins(id: number, dto: PurchaseCoinDto): Promise<User> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    // let newBalance = 0;
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const user = await queryRunner.manager.findOne(User, {
        where: { id: id },
        relations: [`profile`],
      });
      if (!user) {
        throw new NotFoundException(`user not found`);
      }
      if (user?.isBanned) {
        throw new UnprocessableEntityException(`a banned user`);
      }

      const newBalance = user.profile?.balance + dto.coins;
      user.profile.balance = newBalance;

      const ledger = new Ledger({
        debit: dto.coins,
        ledgerType: LedgerType.DEBIT_PURCHASE,
        balance: newBalance,
        note: `코인 구매 (앱)`,
        userId: id,
      });
      await queryRunner.manager.save(ledger);

      await queryRunner.manager.save(user);
      // commit transaction now:
      await queryRunner.commitTransaction();

      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

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
}
