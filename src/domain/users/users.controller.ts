import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune.dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune.dto';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { ValidateUsernamePipe } from 'src/domain/users/pipes/validate-username.pipe';
import { DailyFortunePipe } from 'src/domain/users/pipes/daily-fortune.pipe';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { LoveFortunePipe } from 'src/domain/users/pipes/love-fortune.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
import { YearlyFortunePipe } from 'src/domain/users/pipes/yearly-fortune.pipe';
import { UsersService } from 'src/domain/users/users.service';
import { multerOptions } from 'src/helpers/multer-options';
import { AvatarInterceptor } from './interceptors/avatar-interceptor';
import { SmsMessageDto } from 'src/domain/users/dto/sms-message.dto';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { SkipThrottle } from '@nestjs/throttler';
import { SignedUrl, AnyData } from 'src/common/types';
import { ChangeUsernameDto } from 'src/domain/users/dto/change-username.dto';
@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(SmsClient) private readonly smsClient: SmsClient,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '[관리자] User 생성' })
  @Post()
  async create(
    @Body(UniqueKeysPipe, HashPasswordPipe) dto: CreateUserDto,
  ): Promise<User> {
    return await this.usersService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 리스트 w/ Pagination' })
  @UseInterceptors(AvatarInterceptor)
  @UsePipes(new ValidationPipe({ transform: true }))
  @PaginateQueryOptions()
  @Get()
  async getUsers(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAll(query);
  }

  // hey, controller is all about routing. method order matters here. do not change the order.
  @ApiOperation({ description: '본인 User 상세보기' })
  @Get('mine')
  async getMine(@CurrentUserId() id: number): Promise<User> {
    return await this.usersService.findById(id, [
      'profile',
      //'providers',
      'categoriesInterested',
      'categoriesInterested.category',
    ]);
  }

  @ApiOperation({ description: 'User 상세보기' })
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.findById(id, [
      'profile',
      //'providers',
      'categoriesInterested',
      'categoriesInterested.category',
      'languageSkills',
      'languageSkills.language',
      'accusedReports',
    ]);
  }

  @ApiOperation({ description: 'initial username' })
  @Get(':id/username')
  getInitialUsername(@Param('id', ParseIntPipe) id: number): AnyData {
    return {
      data: this.usersService.getInitialUsername(id),
    };
  }

  @ApiOperation({ description: '신한사주 올해의 운세' })
  @HttpCode(HttpStatus.OK)
  @Post('yearly')
  async askYearly(
    @Body(YearlyFortunePipe) dto: YearlyFortuneDto,
  ): Promise<any> {
    return await this.usersService.askYearly(dto);
  }

  @ApiOperation({ description: '신한사주 오늘의 운세' })
  @HttpCode(HttpStatus.OK)
  @Post('daily')
  async askDaily(@Body(DailyFortunePipe) dto: DailyFortuneDto): Promise<any> {
    return await this.usersService.askDaily(dto);
  }

  @ApiOperation({ description: '신한궁합' })
  @HttpCode(HttpStatus.OK)
  @Post('love')
  async askLove(@Body(LoveFortunePipe) dto: LoveFortuneDto): Promise<any> {
    return await this.usersService.askLove(dto);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // extend functionality to be able to update other related models as well
  @ApiOperation({ description: '[관리자] User 갱신' })
  @Patch('admin/:userId')
  async updateExtended(
    @Param('userId') userId: number,
    @Body() body: any,
  ): Promise<User> {
    return await this.usersService.updateExtended(userId, body);
  }

  @ApiOperation({ description: 'User 갱신' })
  @Patch(':userId')
  async update(
    @Param('userId') userId: number,
    @Body(ValidateUsernamePipe) dto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(userId, dto);
  }

  // A dedicated endpoint to update username.
  @ApiOperation({ description: 'User 닉네임 갱신' })
  @Patch(':userId/username')
  async changeUsername(
    @CurrentUserId() id: number,
    @Param('userId') userId: number,
    @Body(ValidateUsernamePipe) dto: ChangeUsernameDto,
  ): Promise<AnyData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const balance = await this.usersService.changeUsername(userId, dto);
    return {
      data: balance,
    };
  }

  // A dedicated endpoint to update password.
  @ApiOperation({ description: 'User 비밀번호 갱신' })
  @Patch(':userId/password')
  async changePassword(
    @CurrentUserId() id: number,
    @Param('userId') userId: number,
    @Body(HashPasswordPipe) dto: ChangePasswordDto,
  ): Promise<User> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }

    return await this.usersService.changePassword(userId, dto);
  }

  // Technically, `profile` is a different model.
  // but, it's tightly coupled with `user` model
  @ApiOperation({ description: 'User 와 연계된 Profile 갱신' })
  @Patch(':userId/profile')
  async updateProfile(
    @Param('userId') userId: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<Profile> {
    return await this.usersService.updateProfile(userId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 탈퇴' })
  @Delete(':userId')
  async remove(
    @Param('userId') userId: number,
    @Body() dto: DeleteUserDto,
  ): Promise<User> {
    return await this.usersService.quit(userId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 프로필사진 갱신' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':userId/avatar')
  async upload(
    @Param('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.usersService.upload(userId, file);
  }

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('image/url')
  async getSignedUrl(
    @CurrentUserId() id: number,
    @Body('mimeType') mimeType: string,
  ): Promise<SignedUrl> {
    if (mimeType) {
      return await this.usersService.getSignedUrl(id, mimeType);
    }
    throw new BadRequestException('mimeType is missing');
  }

  //--------------------------------------------------------------------------//
  // Some extra endpoints
  //--------------------------------------------------------------------------//
  @ApiOperation({ description: 'OTP 발송' })
  @HttpCode(HttpStatus.OK)
  @Post('otp')
  async sendOtp(@Body() dto: SmsMessageDto): Promise<void> {
    await this.smsClient.send({
      to: dto.phone,
      content: dto.body,
    });
  }
}
