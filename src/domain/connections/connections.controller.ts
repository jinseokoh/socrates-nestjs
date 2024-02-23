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
import { ConnectionsService } from 'src/domain/connections/connections.service';
import { CreateConnectionDto } from 'src/domain/connections/dto/create-connection.dto';
import { UpdateConnectionDto } from 'src/domain/connections/dto/update-connection.dto';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '커넥션 답변 추가' })
  @Post()
  async createConnection(
    @CurrentUserId() userId: number,
    @Body() dto: CreateConnectionDto,
  ): Promise<Connection> {
    try {
      return await this.connectionsService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? Upsert
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '커넥션 답변 추가' })
  @Post('upsert')
  async upsertConnection(
    @CurrentUserId() userId: number,
    @Body() dto: CreateConnectionDto,
  ): Promise<void> {
    try {
      await this.connectionsService.upsert({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Connection 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    return await this.connectionsService.findAll(query);
  }

  //? the commenting out relations can be ignored to reduce the amount of response
  @ApiOperation({ description: 'Connection 상세보기' })
  @Get(':id')
  async getConnectionById(@Param('id') id: number): Promise<Connection> {
    return await this.connectionsService.findById(id, [
      'dot',
      'remarks',
      'remarks.user',
      'remarks.user.profile',
      'userReports',
      // 'userReactions',
      'user',
      'user.profile',
      'user.connections',
      'user.connections.dot',
      'user.connections.user',
      'user.connections.remarks',
      'user.connections.remarks.user',
      // 'user.sentFriendships',
      // 'user.receivedFriendships',
    ]);
  }

  @ApiOperation({ description: 'Connection 의 reaction 리스트' })
  @Get(':id/reactions')
  async getConnectionReactionsById(
    @Param('id') id: number,
  ): Promise<Reaction[]> {
    const connection = await this.connectionsService.findById(id, [
      'userReactions',
      'userReactions.user',
      'userReactions.user.profile',
    ]);

    return connection.userReactions ?? [];
  }

  @ApiOperation({ description: '이 회원의 Connection 리스트 전부 보기' })
  @Get('users/:id')
  async getConnectionByUserId(@Param('id') id: number): Promise<Connection[]> {
    return await this.connectionsService.findByUserId(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '발견글 수정' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConnectionDto,
  ): Promise<Connection> {
    return await this.connectionsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  // just for testing
  @ApiOperation({ description: 'seed dots' })
  @Post('seed')
  async seedConnections(): Promise<void> {
    return await this.connectionsService.seedConnections();
  }
}
