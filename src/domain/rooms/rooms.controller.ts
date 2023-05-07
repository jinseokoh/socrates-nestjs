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
    @CurrentUserId() hostId: number,
    @Body() dto: CreateRoomDto,
  ): Promise<Room> {
    return await this.roomsService.create({ ...dto, hostId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '모든 Room 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getRooms(@Paginate() query: PaginateQuery): Promise<Paginated<Room>> {
    console.log(query);
    return await this.roomsService.findAll(query);
  }

  @ApiOperation({ description: 'Room 상세보기' })
  @Get(':id')
  async getRoomById(@Param('id') id: number): Promise<Room> {
    console.log(id);
    return this.roomsService.findById(id, ['host', 'guest']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateRoomDto,
  ): Promise<Room> {
    return await this.roomsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Room> {
    return await this.roomsService.softRemove(id);
  }
}
