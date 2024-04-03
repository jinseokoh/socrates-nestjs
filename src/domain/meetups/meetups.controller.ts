import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import * as moment from 'moment';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { AnyData, SignedUrl } from 'src/common/types';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { Room } from 'src/domain/chats/entities/room.entity';
import { multerOptions } from 'src/helpers/multer-options';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 생성' })
  @Post()
  async create(
    @CurrentUserId() id: number,
    @Body() dto: CreateMeetupDto,
  ): Promise<Meetup> {
    console.log(dto);

    const userId = dto.userId ? dto.userId : id;
    const expiredAt = dto.expiredAt
      ? dto.expiredAt
      : moment().add(1, 'month').toDate();
    const createMeetupDto = { ...dto, userId, expiredAt };

    return await this.meetupsService.create(createMeetupDto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Meetup 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getMeetups(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    return await this.meetupsService.findAll(query);
  }

  @ApiOperation({ description: 'Meetup room 정보보기' })
  @Get(':id/rooms')
  async fetchRoomsByMeetupId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Room[]> {
    return await this.meetupsService.fetchRoomsByMeetupId(id);
  }

  @ApiOperation({ description: 'Meetup 상세보기' })
  @Get(':id')
  async getMeetupById(@Param('id', ParseIntPipe) id: number): Promise<Meetup> {
    return await this.meetupsService.findById(id, [
      'venue',
      'user',
      'user.profile',
      'careers',
      'categories',
      'threads',
      'threads.user',
      'usersLiked',
      'usersLiked.user',
      'usersLiked.user.profile',
      'userReports',
      // 'rooms',
      'joins',
      'joins.askingUser',
      'joins.askingUser.profile',
      'joins.askedUser',
      'joins.askedUser.profile',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 갱신' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMeetupDto,
  ): Promise<Meetup> {
    return await this.meetupsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup soft 삭제' })
  @Delete(':id')
  async softRemove(@Param('id', ParseIntPipe) id: number): Promise<Meetup> {
    return await this.meetupsService.softRemove(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '단일 이미지 저장후 URL (string) 리턴' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post('image')
  async uploadImage(
    @CurrentUserId() id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnyData> {
    return await this.meetupsService.uploadImage(id, file);
  }

  @ApiOperation({ description: 'Artwork 이미지들 저장후 URLs (string[]) 리턴' })
  @UseInterceptors(FilesInterceptor('files', 9, multerOptions))
  @Post('images')
  async uploadImages(
    @CurrentUserId() id: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<AnyData> {
    return await this.meetupsService.uploadImages(id, files);
  }

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('image/url')
  async getSignedUrl(
    @CurrentUserId() id: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.meetupsService.getSignedUrl(id, dto);
  }
}
