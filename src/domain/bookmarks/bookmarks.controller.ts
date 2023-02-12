import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { BookmarksService } from 'src/domain/bookmarks/bookmarks.service';
import { CreateBookmarkDto } from 'src/domain/bookmarks/dto/create-bookmark.dto';
import { UpdateBookmarkDto } from 'src/domain/bookmarks/dto/update-bookmark.dto';
import { Bookmark } from 'src/domain/bookmarks/entities/bookmark.entity';
@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class BookmarksController {
  constructor(
    // @Inject(RABBITMQ_CLIENT) private readonly rmqClient: ClientProxy,
    // @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    // private readonly usersService: UsersService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '입찰 생성' })
  @Post('meetups/:meetupId/bookmarks')
  async create(
    @CurrentUserId() userId: string,
    @Param('meetupId') meetupId: string,
    @Body() dto: CreateBookmarkDto,
  ): Promise<Bookmark> {
    const updatedDto = { ...dto, userId, meetupId };
    console.log(dto, updatedDto);
    return await this.bookmarksService.create({ ...dto, userId, meetupId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '모든 입찰 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('bookmarks')
  async getAllBookmarks(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Bookmark>> {
    return await this.bookmarksService.findAll(query);
  }

  @ApiOperation({ description: '입찰 상세보기' })
  @Get('bookmarks/:bookmarkId')
  async getBookmarkById(@Param('bookmarkId') id: string): Promise<Bookmark> {
    return this.bookmarksService.findById(id, ['meetup', 'user']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '입찰 수정' })
  @Patch('bookmarks/:bookmarkId')
  async update(
    @Param('bookmarkId') id: string,
    @Body() dto: UpdateBookmarkDto,
  ): Promise<Bookmark> {
    return await this.bookmarksService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '관리자) 입찰 hard 삭제' })
  @Delete('bookmarks/:bookmarkId')
  async removeHard(@Param('bookmarkId') id: string): Promise<Bookmark> {
    return await this.bookmarksService.remove(id);
  }
}
