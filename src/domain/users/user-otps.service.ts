import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as random from 'randomstring';
import * as moment from 'moment';
import 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Secret } from 'src/domain/users/entities/secret.entity';
import { SesService } from 'src/services/aws/ses.service';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UsersService } from 'src/domain/users/users.service';

@Injectable()
export class UserOtpsService {
  private readonly env: any;
  private readonly logger = new Logger(UserOtpsService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Secret)
    private readonly secretRepository: Repository<Secret>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    @Inject(SmsClient) private readonly smsClient: SmsClient, // naver
    private readonly usersService: UsersService,
    private readonly sesService: SesService,
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 본인인증 OTP 발송 (전화번호 또는 이메일로 전송)
  //? ----------------------------------------------------------------------- //

  async sendOtpForNonExistingUser(val: string, cache = false): Promise<void> {
    const phone = val.includes('@') ? null : val.replace(/-/gi, '');
    const email = val.includes('@') ? val : null;
    const where = val.includes('@') ? { email } : { phone };
    const user = await this.usersService.findByUniqueKey({ where });
    if (user) {
      throw new UnprocessableEntityException('already taken');
    }

    let otp = '';
    if (phone) {
      // 휴대폰본인인증이 필수인 경우, app store 승인정보 제공하기 위한 방법.
      if (phone.startsWith('0101234')) {
        otp = cache
          ? await this._upsertOtpUsingCache(phone, '000000')
          : await this._upsertOtpUsingDb(phone, '000000');
      } else {
        otp = cache
          ? await this._upsertOtpUsingCache(phone)
          : await this._upsertOtpUsingDb(phone);
        await this._sendSmsTo(phone, otp);
      }
    } else {
      otp = cache
        ? await this._upsertOtpUsingCache(email)
        : await this._upsertOtpUsingDb(email);
      await this.sesService.sendOtpEmail(email, otp);
    }
  }

  //? ----------------------------------------------------------------------- //
  //? 본인인증 OTP 검사 후, User 업데이트
  //? ----------------------------------------------------------------------- //

  async checkOtp(
    id: number, // userId
    val: string,
    otp: string,
    cache: boolean,
    dto: UpdateUserDto,
  ): Promise<User> {
    const phone = val.includes('@') ? null : val.replace(/-/gi, '');
    const email = val.includes('@') ? val : null;
    const key = phone ? phone : email;

    if (cache) {
      const cacheKey = this._getCacheKey(key);
      const cachedOtp = await this.cacheManager.get(cacheKey);
      if (!cachedOtp) {
        throw new UnprocessableEntityException('otp expired');
      } else if (cachedOtp !== otp) {
        throw new UnprocessableEntityException('otp mismatched');
      }
    } else {
      const secret = await this.secretRepository.findOne({
        where: { key: key },
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

    const user = await this.repository.preload({ id, ...dto });
    return await this.repository.save(user);
  }

  //? ----------------------------------------------------------------------- //
  //? @deprecated. 기존회원 본인인증정보 수정) 전화번호/이메일 확인 후 OTP 전송
  //? ----------------------------------------------------------------------- //

  async sendOtpForExistingUser(val: string, cache = false): Promise<void> {
    const phone = val.includes('@') ? null : val.replace(/-/gi, '');
    const email = val.includes('@') ? val : null;
    const where = val.includes('@') ? { email } : { phone };
    const user = await this.usersService.findByUniqueKey({ where });
    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (phone) {
      const otp = cache
        ? await this._upsertOtpUsingCache(phone)
        : await this._upsertOtpUsingDb(phone);
      await this._sendSmsTo(phone, otp);
    } else {
      const otp = cache
        ? await this._upsertOtpUsingCache(email)
        : await this._upsertOtpUsingDb(email);
      await this.sesService.sendOtpEmail(email, otp);
    }
  }

  //? ----------------------------------------------------------------------- //
  //? privates
  //? ----------------------------------------------------------------------- //

  _getCacheKey(key: string): string {
    return `${this.env}:user:${key}:key`;
  }

  async _upsertOtpUsingDb(key: string, otp = null): Promise<string> {
    const pass = otp ? otp : random.generate({ length: 6, charset: 'numeric' });
    await this.repository.manager.query(
      "INSERT IGNORE INTO secret (`key`, `otp`) \
VALUES (?, ?) \
ON DUPLICATE KEY UPDATE `key`=VALUES(`key`), `otp`=VALUES(`otp`), updatedAt=(CONVERT_TZ(NOW(), 'UTC', 'Asia/Seoul'))",
      [key, pass],
    );
    return pass;
  }

  async _upsertOtpUsingCache(key: string, otp = null): Promise<string> {
    const pass = otp ? otp : random.generate({ length: 6, charset: 'numeric' });
    const cacheKey = this._getCacheKey(key);
    await this.cacheManager.set(cacheKey, pass, 60 * 10);
    return pass;
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
}
