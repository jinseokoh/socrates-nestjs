import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
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
import { LikeQuery } from 'src/common/decorators/query-like.decorator';
import { SortQuery } from 'src/common/decorators/query-sort.decorator';
import { IKeyVal } from 'src/common/interfaces';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { AmendUsernamePipe } from 'src/domain/users/pipes/amend-username.pipe';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
import { User } from 'src/domain/users/user.entity';
import { UsersService } from 'src/domain/users/users.service';
import { multerOptions } from 'src/helpers/multer-options';
import { NaverService } from 'src/services/naver/naver.service';
import { AvatarInterceptor } from './interceptors/avatar-interceptor';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly naverService: NaverService,
  ) {}

  @ApiOperation({ description: '[Admin] 사용자 생성' })
  @Post()
  async create(
    @Body(UniqueKeysPipe, HashPasswordPipe) dto: CreateUserDto,
  ): Promise<User> {
    return await this.usersService.create(dto);
  }

  @ApiOperation({ description: '사용자 아바타 생성' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':id/avatar')
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: number,
  ) {
    return await this.usersService.upload(id, file);
  }

  @ApiOperation({ description: '[Admin] 사용자 리스트 w/ Pagination' })
  @UseInterceptors(AvatarInterceptor)
  @PaginateQueryOptions()
  @Get('admin')
  async getUsersForAdmin(
    @Paginate() query: PaginateQuery,
    @LikeQuery() like: IKeyVal | null,
    @SortQuery() sort: IKeyVal | null,
    // @Query('search') search: string | null,
  ): Promise<Paginated<User>> {
    return this.usersService.findAllForAdmin(query, like, sort);
  }

  @ApiOperation({ description: '사용자 리스트 w/ Pagination' })
  @UseInterceptors(AvatarInterceptor)
  @PaginateQueryOptions()
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUsers(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ description: '나의 사용자 상세보기' })
  @Get('mine')
  async getMine(@CurrentUserId() id: number): Promise<User> {
    return await this.usersService.findById(id);
  }

  @ApiOperation({ description: '사용자 상세보기' })
  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<User> {
    return await this.usersService.findById(id, [
      'profile',
      'artist',
      'providers',
    ]);
  }

  @ApiOperation({ description: '사용자 카카오 알림 보내기' })
  @Post(':id/alim')
  async sendAlimtalk(@Param('id') id: number): Promise<void> {
    const user = await this.usersService.findById(id);

    if (!user.phone) {
      throw new BadRequestException(`phone number is not available`);
    }

    await this.naverService.sendAlimtalk(
      'PAYSUCCESS',
      user.phone,
      `안녕하세요. ${user.username}님!

플리옥션 결제가 완료되었습니다.
소중한 작품이 곧 컬렉터님을 찾아갈 예정입니다.

아트 컬렉팅의 시작, 플리옥션!
컬렉터가 되어주셔서 감사합니다.`,
    );
  }

  @ApiOperation({ description: '사용자 SMS 보내기' })
  @Post(':id/sms')
  async sendSms(
    @Param('id') id: number,
    @Body('message') message: string,
  ): Promise<void> {
    const user = await this.usersService.findById(id);

    if (!user.phone) {
      throw new BadRequestException(`phone number is not available`);
    }

    await this.naverService.sendSms(user.phone, message);
  }

  @ApiOperation({ description: '사용자 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body(AmendUsernamePipe) dto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, dto);
  }

  @ApiOperation({ description: '[Admin] 사용자 수정' })
  @Patch(':id/admin')
  async updateForAdmin(
    @Param('id') id: number,
    @Body() body: any,
  ): Promise<User> {
    return await this.usersService.updateForAdmin(id, body);
  }

  @ApiOperation({ description: '사용자 탈퇴' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<User> {
    return await this.usersService.quit(id);
  }
}
