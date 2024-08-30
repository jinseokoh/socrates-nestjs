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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
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
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Icebreaker 생성/수정' })
  @Post()
  async createIcebreaker(
    @CurrentUserId() userId: number,
    @Body() dto: CreateIcebreakerDto,
  ): Promise<Icebreaker> {
    // validation and transform.
    // - recipientId -1 이나 0 이 전달 될 수 있다.
    // - questionId -1 이나 0 이 전달 될 수 있다.
    return await this.icebreakersService.create({
      ...dto,
      userId: dto.userId ?? userId,
      recipientId:
        dto.recipientId && dto.recipientId > 0 ? dto.recipientId : null,
      questionId: dto.questionId && dto.questionId > 0 ? dto.questionId : null,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Icebreaker 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Icebreaker>> {
    return await this.icebreakersService.findAll(query);
  }

  @ApiOperation({ description: 'Icebreaker 상세보기' })
  @Get(':id')
  async findById(@Param('id') id: number): Promise<Icebreaker> {
    return await this.icebreakersService.findById(id, [
      // 'question', not sure if it's
      'user',
      'answers',
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

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 삭제' })
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<Icebreaker> {
    return await this.icebreakersService.softRemove(id);
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
}
