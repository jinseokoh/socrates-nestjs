import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateRoomDto } from 'src/domain/chats/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/chats/dto/update-room.dto';
import { Room } from 'src/domain/chats/entities/room.entity';
import { RoomsService } from 'src/domain/chats/rooms.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
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
    return await this.roomsService.create(
      dto.userId === undefined ? { ...dto, userId } : dto,
    );
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({
    description: '사용자가 참여 중인 모든 Room 리스트 w/ Pagination',
  })
  @PaginateQueryOptions()
  @Get()
  async getRooms(
    @CurrentUserId() userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Room>> {
    console.log(query);
    return await this.roomsService.findAllByUserId(userId, query);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room 갱신' })
  @Patch()
  async update(@Body() dto: UpdateRoomDto): Promise<Room> {
    return await this.roomsService.update(dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Room soft 삭제' })
  @Delete()
  async remove(
    @Body()
    dto: Omit<
      CreateRoomDto,
      'lastReadMessageId' | 'partyType' | 'isPaid' | 'isExcluded' | 'note'
    >,
  ): Promise<Room> {
    return await this.roomsService.remove(dto);
  }
}
