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
import { Opinion } from 'src/domain/inquiries/entities/opinion.entity';
import { OpinionsService } from 'src/domain/inquiries/opinions.service';
import { CreateOpinionDto } from 'src/domain/inquiries/dto/create-opinion.dto';
import { UpdateOpinionDto } from 'src/domain/inquiries/dto/update-opinion.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('inquiries')
export class InquiryOpinionsController {
  constructor(private readonly opinionsService: OpinionsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':inquiryId/opinions')
  async create(
    @CurrentUserId() userId: number,
    @Param('inquiryId') inquiryId: number,
    @Body() dto: CreateOpinionDto,
  ): Promise<any> {
    return await this.opinionsService.create({
      ...dto,
      userId,
      inquiryId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/opinions')
  async getOpinions(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Opinion>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          inquiryId: `$eq:${inquiryId}`,
        },
      },
    };
    return await this.opinionsService.findAll(queryParams);
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/opinions/:opinionId')
  async getOpinionsById(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('opinionId', ParseIntPipe) opinionId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Opinion>> {
    return await this.opinionsService.findAllById(inquiryId, opinionId, query);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':inquiryId/opinions/:opinionId')
  async update(
    @Param('opinionId') id: number,
    @Body() dto: UpdateOpinionDto,
  ): Promise<Opinion> {
    return await this.opinionsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '관리자) 댓글 soft 삭제' })
  @Delete(':inquiryId/opinions/:opinionId')
  async remove(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('opinionId') id: number,
  ): Promise<Opinion> {
    return await this.opinionsService.softRemove(id);
  }
}
