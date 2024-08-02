import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
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
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { PollsService } from 'src/domain/feeds/polls.service';
import { CreatePollDto } from 'src/domain/feeds/dto/create-poll.dto';
import { UpdatePollDto } from 'src/domain/feeds/dto/update-poll.dto';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '커넥션 질문 추가' })
  @Post()
  async createFeed(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePollDto,
  ): Promise<Poll> {
    try {
      return await this.pollsService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: 'Poll 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Poll>> {
    return await this.pollsService.findAll(query);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Poll 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePollDto,
  ): Promise<any> {
    return await this.pollsService.update(id, dto);
  }
}
