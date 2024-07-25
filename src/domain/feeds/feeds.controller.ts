import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { SignedUrl } from 'src/common/types';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { CreateFeedDto } from 'src/domain/feeds/dto/create-feed.dto';
import { UpdateFeedDto } from 'src/domain/feeds/dto/update-feed.dto';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'feed 생성' })
  @Post()
  async createFeed(
    @CurrentUserId() userId: number,
    @Body() dto: CreateFeedDto,
  ): Promise<Feed> {
    try {
      return await this.feedsService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: 'Feed 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Feed>> {
    return await this.feedsService.findAll(query);
  }

  //? the commenting out relations can be ignored to reduce the amount of response
  @ApiOperation({ description: 'Feed 상세보기' })
  @Get(':id')
  async getFeedById(@Param('id') id: number): Promise<Feed> {
    return await this.feedsService.findById(id, [
      'user',
      'poll',
      'feedLinks',
      'pleas',
    ]);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '발견글 수정' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedDto,
  ): Promise<Feed> {
    return await this.feedsService.update(id, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.feedsService.getSignedUrl(userId, dto);
  }
}
