import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { ConnectionsService } from 'src/domain/dots/connections.service';
import { CreateConnectionDto } from 'src/domain/dots/dto/create-connection.dto';
import { Connection } from 'src/domain/users/entities/connection.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 커넥션 리스트에 추가' })
  @Post()
  async createConnection(
    @CurrentUserId() userId: number,
    @Body() dto: CreateConnectionDto,
  ): Promise<void> {
    try {
      return await this.connectionsService.create({ ...dto, userId });
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
  @Get('connections')
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    return await this.connectionsService.findAll(query);
  }

  @ApiOperation({ description: 'return sub-trees' })
  @Get('connections/:id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Connection> {
    return await this.connectionsService.findById(id, [
      'dot',
      'user',
      'remarks',
      'remarks.user',
    ]);
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
