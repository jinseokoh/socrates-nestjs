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
  Sse,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Remark } from 'src/domain/feeds/entities/remark.entity';
import { RemarksService } from 'src/domain/feeds/remarks.service';
import { CreateRemarkDto } from 'src/domain/feeds/dto/create-remark.dto';
import { UpdateRemarkDto } from 'src/domain/feeds/dto/update-remark.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedRemarksController {
  constructor(private readonly remarksService: RemarksService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/remarks')
  async createRemark(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body() dto: CreateRemarkDto,
  ): Promise<any> {
    return await this.remarksService.create({
      ...dto,
      userId,
      feedId,
    });
  }

  @ApiOperation({ description: '답글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/remarks/:remarkId')
  async createReply(
    @CurrentUserId() userId: number,
    @Param('feedId') feedId: number,
    @Param('remarkId', ParseIntPipe) remarkId: number,
    @Body() dto: CreateRemarkDto,
  ): Promise<any> {
    let parentId = null;
    if (remarkId) {
      const remark = await this.remarksService.findById(remarkId);
      parentId = remark.parentId ? remark.parentId : remarkId;
    }
    return await this.remarksService.create({
      ...dto,
      userId,
      feedId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/remarks')
  async getRemarks(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          feedId: `$eq:${feedId}`,
        },
      },
    };

    return await this.remarksService.findAll(queryParams);
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/remarks/:remarkId')
  async getRemarksById(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('remarkId', ParseIntPipe) remarkId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    return await this.remarksService.findAllById(feedId, remarkId, query);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':feedId/remarks/:remarkId')
  async update(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('remarkId') remarkId: number,
    @Body() dto: UpdateRemarkDto,
  ): Promise<Remark> {
    return await this.remarksService.update(remarkId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':feedId/remarks/:remarkId')
  async remove(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('remarkId') remarkId: number,
  ): Promise<Remark> {
    return await this.remarksService.softRemove(remarkId);
  }
}
