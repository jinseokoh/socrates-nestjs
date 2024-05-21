import { SignedUrlDto } from './dto/signed-url.dto';
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
  Query,
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
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { ValidateUsernamePipe } from 'src/domain/users/pipes/validate-username.pipe';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { UsersService } from 'src/domain/users/users.service';
import { multerOptions } from 'src/helpers/multer-options';
import { AvatarInterceptor } from './interceptors/avatar-interceptor';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { SkipThrottle } from '@nestjs/throttler';
import { SignedUrl, AnyData } from 'src/common/types';
import { ChangeUsernameDto } from 'src/domain/users/dto/change-username.dto';
import { initialUsername } from 'src/helpers/random-username';
import { PurchaseCoinDto } from 'src/domain/users/dto/purchase-coin.dto';
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

  @ApiOperation({ description: 'User 생성' })
  @Post()
  async create(
    @Body(UniqueKeysPipe, HashPasswordPipe) dto: CreateUserDto,
  ): Promise<User> {
    return await this.usersService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 리스트 (paginated)' })
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
      'languageSkills',
      'languageSkills.language',
      'accusedReports',
    ]);
  }

  @ApiOperation({ description: 'User 상세보기' })
  @Get(':id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Query('extra') extra: string[],
  ): Promise<User> {
    const defaultRelations = [
      'profile',
      'categoriesInterested',
      'categoriesInterested.category',
      'languageSkills',
      'languageSkills.language',
      'accusedReports',
      // 'sentFriendships',
      // 'receivedFriendships',
      'connections',
      'connections.dot',
    ];
    return extra && extra.length > 0
      ? await this.usersService.findById(id, [...defaultRelations, ...extra])
      : await this.usersService.findById(id, defaultRelations);
  }

  @ApiOperation({ description: 'initial username' })
  @Get(':id/username')
  getInitialUsername(@Param('id', ParseIntPipe) id: number): AnyData {
    return {
      data: initialUsername(id),
    };
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

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
  ): Promise<User> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }

    return await this.usersService.changeUsername(userId, dto);
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

  // note that `profile` is tightly coupled with `user` model
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

  //!@ depreacated
  //! 미사용
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
  @Post(':userId/upload-url')
  async getSignedUrl(
    @Param('userId') userId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.usersService.getSignedUrl(userId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? 코인 구매
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Coin 구매' })
  @HttpCode(HttpStatus.OK)
  @Post(':userId/purchase')
  async sendCoin(
    @Param('userId') userId: number,
    @Body() dto: PurchaseCoinDto,
  ): Promise<User> {
    return await this.usersService.purchase(userId, dto);
  }

  @ApiOperation({ description: 'Cache Bust' })
  @Public()
  @Post('bust')
  async cacheBust(): Promise<any> {
    await this.usersService.cacheBust();
    return `busted cache store`;
  }
}
