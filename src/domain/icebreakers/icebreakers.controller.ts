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
import { IcebreakersService } from 'src/domain/icebreakers/icebreakers.service';
import { CreateIcebreakerDto } from 'src/domain/icebreakers/dto/create-icebreaker.dto';
import { UpdateIcebreakerDto } from 'src/domain/icebreakers/dto/update-icebreaker.dto';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('icebreakers')
export class IcebreakersController {
  constructor(private readonly icebreakersService: IcebreakersService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Icebreaker 생성/수정' })
  @Post()
  async createIcebreaker(
    @CurrentUserId() userId: number,
    @Body() dto: CreateIcebreakerDto,
  ): Promise<Icebreaker> {
    try {
      return await this.icebreakersService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Icebreaker 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Icebreaker>> {
    return await this.icebreakersService.findAll(query);
  }

  //? the commenting out relations can be ignored to reduce the amount of response
  @ApiOperation({ description: 'Icebreaker 상세보기' })
  @Get(':id')
  async getIcebreakerById(@Param('id') id: number): Promise<Icebreaker> {
    return await this.icebreakersService.findById(id, [
      'dot',
      'remarks',
      'remarks.user',
      'remarks.user.profile',
      'userReports',
      'userReactions',
      'user',
      'user.profile',
      'user.icebreakers',
      'user.icebreakers.dot',
      'user.icebreakers.remarks',
      'user.icebreakers.remarks.user',
      // 'user.sentFriendships',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Icebreaker 수정' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIcebreakerDto,
  ): Promise<Icebreaker> {
    return await this.icebreakersService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.icebreakersService.getSignedUrl(userId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  // just for testing
  @ApiOperation({ description: 'seed icebreakers' })
  @Post('seed')
  async seedIcebreakers(): Promise<void> {
    return await this.icebreakersService.seedIcebreakers();
  }
}
