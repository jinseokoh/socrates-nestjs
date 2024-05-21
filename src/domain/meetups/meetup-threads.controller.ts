import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { HttpCacheInterceptor } from 'src/common/interceptors/http-cache.interceptor';
import { CreateThreadDto } from 'src/domain/meetups/dto/create-thread.dto';
import { UpdateThreadDto } from 'src/domain/meetups/dto/update-thread.dto';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { ThreadsService } from 'src/domain/meetups/threads.service';

@UseInterceptors(ClassSerializerInterceptor, HttpCacheInterceptor)
@Controller('meetups')
export class MeetupThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 생성' })
  @Post(':meetupId/threads')
  async createThread(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateThreadDto,
  ): Promise<Thread> {
    return await this.threadsService.create({ ...dto, userId, meetupId });
  }

  @ApiOperation({ description: '답글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':meetupId/threads/:threadId')
  async createReply(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() dto: CreateThreadDto,
  ): Promise<any> {
    let parentId = null;
    if (threadId) {
      const thread = await this.threadsService.findById(threadId);
      parentId = thread.parentId ? thread.parentId : threadId;
    }
    return await this.threadsService.create({
      ...dto,
      userId,
      meetupId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  //? 댓글리스트, 답글은 sorting 되지 않고 id 역순으로 나열
  @ApiOperation({ description: '댓글(Q) 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/threads')
  async getThreads(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Thread>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          meetupId: `$eq:${meetupId}`,
        },
      },
    };

    return await this.threadsService.findAll(queryParams);
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/threads/:threadId')
  async getThreadRepliesById(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Thread>> {
    return await this.threadsService.findAllById(meetupId, threadId, query);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':meetupId/threads/:threadId')
  async update(
    // @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() dto: UpdateThreadDto,
  ): Promise<Thread> {
    return await this.threadsService.update(threadId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':meetupId/threads/:threadId')
  async remove(
    // @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
  ): Promise<Thread> {
    return await this.threadsService.softRemove(threadId);
  }
}
