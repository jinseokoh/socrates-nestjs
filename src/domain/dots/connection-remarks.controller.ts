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
import { Remark } from 'src/domain/dots/entities/remark.entity';
import { RemarksService } from 'src/domain/dots/remarks.service';
import { CreateRemarkDto } from 'src/domain/dots/dto/create-remark.dto';
import { UpdateRemarkDto } from 'src/domain/dots/dto/update-remark.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('connections')
export class ConnectionRemarksController {
  constructor(private readonly remarksService: RemarksService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':connectionId/remarks')
  async createRemark(
    @CurrentUserId() userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: CreateRemarkDto,
  ): Promise<any> {
    return await this.remarksService.create({
      ...dto,
      userId,
      connectionId,
    });
  }

  @ApiOperation({ description: '답글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':connectionId/remarks/:remarkId')
  async createReply(
    @CurrentUserId() userId: number,
    @Param('connectionId') connectionId: number,
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
      connectionId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':connectionId/remarks')
  async getRemarks(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          connectionId: `$eq:${connectionId}`,
        },
      },
    };

    return await this.remarksService.findAll(queryParams);
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':connectionId/remarks/:remarkId')
  async getRemarksById(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Param('remarkId', ParseIntPipe) remarkId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    return await this.remarksService.findAllById(connectionId, remarkId, query);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':connectionId/remarks/:remarkId')
  async update(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Param('remarkId') remarkId: number,
    @Body() dto: UpdateRemarkDto,
  ): Promise<Remark> {
    return await this.remarksService.update(remarkId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':connectionId/remarks/:remarkId')
  async remove(
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Param('remarkId') remarkId: number,
  ): Promise<Remark> {
    return await this.remarksService.softRemove(remarkId);
  }
}
