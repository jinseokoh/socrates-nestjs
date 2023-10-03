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
import { CreateRoomDto } from 'src/domain/rooms/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/rooms/dto/update-room.dto';
import { Room } from 'src/domain/rooms/entities/room.entity';
import { RoomsService } from 'src/domain/rooms/rooms.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateRoomDto,
  ): Promise<Room> {
    return await this.roomsService.create({ ...dto, userId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '모든 Room 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getRooms(
    @CurrentUserId() userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Room>> {
    console.log(query);
    return await this.roomsService.findAllByUserId(userId, query);
  }

  @ApiOperation({ description: 'Room 상세보기' })
  @Get(':ids')
  async getRoomById(@Param('ids') ids: string): Promise<Room> {
    const [userId, meetupId] = ids.split(',');
    return this.roomsService.findByIds(+userId, +meetupId, ['user', 'meetup']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room 갱신' })
  @Patch(':ids')
  async update(
    @Param('ids') ids: string,
    @Body() dto: UpdateRoomDto,
  ): Promise<Room> {
    const [userId, meetupId] = ids.split(',');
    return await this.roomsService.update(+userId, +meetupId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room soft 삭제' })
  @Delete(':ids')
  async remove(@Param('ids') ids: string): Promise<Room> {
    const [userId, meetupId] = ids.split(',');
    return await this.roomsService.softRemove(+userId, +meetupId);
  }
}
