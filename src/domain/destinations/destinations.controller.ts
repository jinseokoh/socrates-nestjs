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
import { Destination } from 'src/domain/destinations/destination.entity';
import { DestinationsService } from 'src/domain/destinations/destinations.service';
import { CreateDestinationDto } from 'src/domain/destinations/dto/create-destination.dto';
import { UpdateDestinationDto } from 'src/domain/destinations/dto/update-destination.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @ApiOperation({ description: '배송지 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateDestinationDto,
  ): Promise<Destination> {
    return await this.destinationsService.create({ ...dto, userId });
  }

  @ApiOperation({ description: '배송지 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getDestinations(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Destination>> {
    return await this.destinationsService.findAll(query);
  }

  @ApiOperation({ description: '배송지 상세보기' })
  @Get(':id')
  async getDestinationsById(@Param('id') id: number): Promise<Destination> {
    return await this.destinationsService.findById(id);
  }

  @ApiOperation({ description: '배송지 수정' })
  @Patch(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id') id: number,
    @Body() dto: UpdateDestinationDto,
  ): Promise<Destination> {
    return await this.destinationsService.update(id, { ...dto, userId });
  }

  @ApiOperation({ description: '배송지 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Destination> {
    return await this.destinationsService.remove(id);
  }
}
