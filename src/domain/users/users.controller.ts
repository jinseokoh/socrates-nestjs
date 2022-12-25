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
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';

import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { UpdateProfileDto } from 'src/domain/profiles/dto/update-profile.dto';
import { Profile } from 'src/domain/profiles/profile.entity';
import { ChangePasswordDto } from 'src/domain/users/dto/change-password.dto';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { DeleteUserDto } from 'src/domain/users/dto/delete-user.dto';
import { IamportCertificationDto } from 'src/domain/users/dto/iamport-certification.dto';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { AmendUsernamePipe } from 'src/domain/users/pipes/amend-username.pipe';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
import { User } from 'src/domain/users/user.entity';
import { UsersService } from 'src/domain/users/users.service';
import { multerOptions } from 'src/helpers/multer-options';
import { IamportService } from 'src/services/iamport/iamport.service';
import { AvatarInterceptor } from './interceptors/avatar-interceptor';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly iamportService: IamportService,
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
  @PaginateQueryOptions()
  @ApiCreatedResponse({
    type: Paginated<User>,
  })
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUsers(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAll(query);
  }

  // hey, controller is all about routing. method order matters here. do not change the order.
  @ApiOperation({ description: '본인 User 상세보기' })
  @Get('mine')
  async getMine(@CurrentUserId() id: number): Promise<User> {
    return await this.usersService.findById(id);
  }

  @ApiOperation({ description: '신한사주' })
  @Get('luck')
  async askLuck(@Param('id') id: number): Promise<any> {
    return await this.usersService.askLuck(id);
  }

  @ApiOperation({ description: '신한궁합' })
  @Get('love')
  async askLove(@Param('id') id: number): Promise<any> {
    return await this.usersService.askLove(id);
  }

  @ApiOperation({ description: '역술' })
  @Get('yuksul')
  async askYuksul(@Param('id') id: number): Promise<any> {
    return await this.usersService.askYuksul(id);
  }

  @ApiOperation({ description: 'User 상세보기' })
  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<User> {
    return await this.usersService.findUserDetailById(id, [
      'profile',
      'artist',
    ]);
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

  // You can argue with me that this isn't necessary but, I assumed a dedicated
  // endpoint to update password wouldn't hurt anyone.
  @ApiOperation({ description: 'User 비밀번호 갱신' })
  @Patch(':id/password')
  async changePassword(
    @CurrentUserId() userId: number,
    @Param('id') id: number,
    @Body(HashPasswordPipe) dto: ChangePasswordDto,
  ): Promise<User> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }

    return await this.usersService.changePassword(id, dto);
  }

  // I had to submit a request form to IAMPORT to be able to receive
  // additinoal information including phone number (status: completed.)
  @ApiOperation({ description: 'User 본인인증정보 갱신' })
  @Patch(':id/certify')
  async certify(
    @Param('id') id: number,
    @Body() dto: IamportCertificationDto,
  ): Promise<User> {
    const resp = await this.iamportService.getCertificationResponse(
      dto.imp_uid,
    );
    const { name, gender, birth, phone } = resp;
    const payload = {
      realname: name,
      gender: gender.includes('f') || gender.includes('F') ? 'F' : 'M',
      dob: new Date(birth).toISOString(),
      phone: phone,
    } as UpdateUserDto;

    return await this.usersService.update(id, payload);
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

  // This doesn't necessarily belong to User model. and, surely, you can even
  // call this AWS S3 API within a client. But, in case you want it to exist
  // on a server side... This is it.
  //! method order matters here.
  @ApiOperation({ description: '사용자 s3 파일 삭제' })
  @Delete('/s3')
  async deleteAvatar(@Body('src') src: string) {
    return await this.usersService.deleteS3file(src);
  }

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
