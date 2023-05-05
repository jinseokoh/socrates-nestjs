import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune-dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune-dto';
import { UpdateProfileDto } from 'src/domain/users/dto/update-profile.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune-dto';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { AmendUsernamePipe } from 'src/domain/users/pipes/amend-username.pipe';
import { DailyFortunePipe } from 'src/domain/users/pipes/daily-fortune.pipe';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { LoveFortunePipe } from 'src/domain/users/pipes/love-fortune.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
import { YearlyFortunePipe } from 'src/domain/users/pipes/yearly-fortune.pipe';
import { UsersService } from 'src/domain/users/users.service';
import { multerOptions } from 'src/helpers/multer-options';
import { AvatarInterceptor } from './interceptors/avatar-interceptor';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    return await this.usersService.findById(id, ['profile']);
  }

  @ApiOperation({ description: 'User 상세보기' })
  @Get(':id')
  async getUserDetailById(@Param('id') id: number): Promise<User> {
    return await this.usersService.findUserDetailById(id, [
      'profile',
      'provider',
    ]);
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
  @Patch('admin/:id')
  async updateExtended(
    @Param('id') id: number,
    @Body() body: any,
  ): Promise<User> {
    return await this.usersService.updateExtended(id, body);
  }

  @ApiOperation({ description: 'User 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body(AmendUsernamePipe) dto: UpdateUserDto,
  ): Promise<User> {
    console.log(dto);
    return await this.usersService.update(id, dto);
  }

  @ApiOperation({ description: 'User 프로필사진 갱신' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':id/avatar')
  async upload(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.usersService.upload(id, file);
  }

  // A dedicated endpoin to update password only.
  @ApiOperation({ description: 'User 비밀번호 갱신' })
  @Patch(':id/password')
  async changePassword(
    @CurrentUserId() id: number,
    @Param('userId') userId: number,
    @Body(HashPasswordPipe) dto: ChangePasswordDto,
  ): Promise<User> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }

    return await this.usersService.changePassword(id, dto);
  }

  // Technically, Profile is a different model but, it's tightly coupled
  // with User model
  @ApiOperation({ description: 'User 와 연계된 Profile 갱신' })
  @Patch(':id/profile')
  async updateProfile(
    @Param('id') id: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<Profile> {
    return await this.usersService.updateProfile(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 탈퇴' })
  @Delete(':id')
  async remove(
    @Param('id') id: number,
    @Body() dto: DeleteUserDto,
  ): Promise<User> {
    return await this.usersService.quit(id, dto);
  }

  //--------------------------------------------------------------------------//
  // Some extra endpoints
  //--------------------------------------------------------------------------//
}
