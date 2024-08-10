import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { ChangeRoomIsPaidDto } from 'src/domain/chats/dto/change-room-is-paid.dto';
import { CreateRoomDto } from 'src/domain/chats/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/chats/dto/update-room.dto';
import { Room } from 'src/domain/chats/entities/room.entity';
import { RoomsService } from 'src/domain/chats/rooms.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

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

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description: '사용자가 참여 중인 모든 Room 리스트 w/ Pagination',
  })
  @PaginateQueryOptions()
  @Get()
  async getRooms(
    @CurrentUserId() userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Room>> {
    return await this.roomsService.findAllByUserId(userId, query);
  }

  @ApiOperation({ description: 'Room 상세보기' })
  @Get(':id')
  async getAuctionById(@Param('id') id: number): Promise<Room> {
    return await this.roomsService.findById(id, [
      'participants',
      'participants.user',
    ]);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Room 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateRoomDto,
  ): Promise<Room> {
    return await this.roomsService.update(id, dto);
  }

  // @ApiOperation({ description: '입장료 지불' })
  // @Put()
  // async payRoomFee(@Body() dto: ChangeRoomIsPaidDto): Promise<Room> {
  //   return await this.roomsService.payRoomFee(dto);
  // }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Room 삭제' })
  @Delete(':id')
  async remove(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.roomsService.remove(id, userId);
  }
}
