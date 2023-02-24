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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
import { UpdateMeetupDto } from 'src/domain/meetups/dto/update-meetup.dto';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupsService } from 'src/domain/meetups/meetups.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateMeetupDto,
  ): Promise<Meetup> {
    const createMeetupDto = dto.userId ? dto : { ...dto, userId: userId };
    return await this.meetupsService.create(createMeetupDto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getMeetups(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const a = this.meetupsService.findAll(query);
    console.log(a);
    return a;
  }

  @ApiOperation({ description: 'Meetup 상세보기' })
  @Get(':id')
  async getMeetupById(@Param('id') id: string): Promise<Meetup> {
    console.log(id);
    return await this.meetupsService.findById(id, [
      'user',
      'categories',
      'bookmarks',
      'bookmarks.user',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetupDto,
  ): Promise<Meetup> {
    return await this.meetupsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup soft 삭제' })
  @Delete(':id')
  async softRemove(@Param('id') id: string): Promise<Meetup> {
    return await this.meetupsService.softRemove(id);
  }
}
