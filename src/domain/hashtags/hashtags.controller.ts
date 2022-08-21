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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateHashtagDto } from 'src/domain/hashtags/dto/create-hashtag.dto';
import { UpdateHashtagDto } from 'src/domain/hashtags/dto/update-hashtag.dto';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { HashtagsService } from 'src/domain/hashtags/hashtags.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @ApiOperation({ description: '해쉬택 생성' })
  @Post()
  async create(
    @Body()
    dto: CreateHashtagDto,
  ): Promise<Hashtag> {
    return await this.hashtagsService.create(dto);
  }

  @ApiOperation({ description: '해쉬택 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getHashtags(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Hashtag>> {
    return await this.hashtagsService.findAll(query);
  }

  @ApiOperation({ description: '해쉬택 상세보기' })
  @Get(':id')
  async getHashtagById(@Param('id') id: number): Promise<Hashtag> {
    return await this.hashtagsService.findById(id);
  }

  @ApiOperation({ description: '해쉬택 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateHashtagDto,
  ): Promise<Hashtag> {
    return await this.hashtagsService.update(id, dto);
  }

  @ApiOperation({ description: '해쉬택 hard 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Hashtag> {
    return await this.hashtagsService.remove(id);
  }
}
