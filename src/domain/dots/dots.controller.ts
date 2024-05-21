import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { DotsService } from 'src/domain/dots/dots.service';
import { CreateDotDto } from 'src/domain/dots/dto/create-dot.dto';
import { UpdateDotDto } from 'src/domain/dots/dto/update-dot.dto';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { HttpCacheInterceptor } from 'src/common/interceptors/http-cache.interceptor';

@UseInterceptors(ClassSerializerInterceptor, HttpCacheInterceptor)
@Controller('dots')
export class DotsController {
  constructor(private readonly dotsService: DotsService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '커넥션 질문 추가' })
  @Post()
  async createConnection(
    @CurrentUserId() userId: number,
    @Body() dto: CreateDotDto,
  ): Promise<Dot> {
    try {
      return await this.dotsService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Dot 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Dot>> {
    return await this.dotsService.findAll(query);
  }

  @Public()
  @ApiOperation({ description: 'all the active dots' })
  @Get('/active')
  async getActives(): Promise<Array<Dot>> {
    return await this.dotsService.getActives();
  }

  @Public()
  @ApiOperation({ description: 'all the inactive dots' })
  @Get('/inactive')
  async getInactives(): Promise<Array<Dot>> {
    return await this.dotsService.getInactives();
  }

  @Public()
  @ApiOperation({ description: 'Dot List' })
  @Get(':slug')
  async getBySlugs(@Param('slug') slug: string): Promise<Array<Dot>> {
    return await this.dotsService.getBySlug(slug);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Dot 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateDotDto,
  ): Promise<any> {
    return await this.dotsService.update(id, dto);
  }

  @ApiOperation({ description: 'Dot 갱신' })
  @Patch(':id/up')
  async thumbsUp(@Param('id') id: number): Promise<any> {
    return await this.dotsService.thumbsUp(id);
  }

  @ApiOperation({ description: 'Dot 갱신' })
  @Patch(':id/down')
  async thumbsDown(@Param('id') id: number): Promise<any> {
    return await this.dotsService.thumbsDown(id);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'seed dots' })
  @Post('seed')
  async seedDots(): Promise<void> {
    return await this.dotsService.seedDots();
  }
}
