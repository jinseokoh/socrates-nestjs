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
import { DotsService } from 'src/domain/dots/dots.service';
import { CreateConnectionDto } from 'src/domain/dots/dto/create-connection.dto';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Connection } from 'src/domain/users/entities/connection.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('dots')
export class DotsController {
  constructor(private readonly dotsService: DotsService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 커넥션 리스트에 추가' })
  @Post(':dotId')
  async createConnection(
    @CurrentUserId() userId: number,
    @Param('dotId') dotId: number,
    @Body() dto: CreateConnectionDto,
  ): Promise<void> {
    try {
      return await this.dotsService.create({ ...dto, userId, dotId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Dot List' })
  @Get()
  async getDots(): Promise<Array<Dot>> {
    return await this.dotsService.getAll();
  }

  @Public()
  @ApiOperation({ description: 'Connection 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('connections')
  async findAllConnections(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    return await this.dotsService.findAll(query);
  }

  @ApiOperation({ description: 'return sub-trees' })
  @Get('connections/:id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<Connection> {
    return await this.dotsService.findById(id, [
      'dot',
      'user',
      'user.connections',
      'user.connections.dot',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed dots' })
  @Post('seed/dots')
  async seedDots(): Promise<void> {
    return await this.dotsService.seedDots();
  }

  @ApiOperation({ description: 'seed dots' })
  @Post('seed/connections')
  async seedConnections(): Promise<void> {
    return await this.dotsService.seedConnections();
  }
}
