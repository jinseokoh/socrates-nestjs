import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateVenueDto } from 'src/domain/meetups/dto/create-meetup_venue.dto';
import { UpdateVenueDto } from 'src/domain/meetups/dto/update-meetup_venue.dto';
import { Venue } from 'src/domain/meetups/entities/venue.entity';
import { VenuesService } from 'src/domain/meetups/meetup-venues.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateVenueDto): Promise<Venue> {
    return await this.venuesService.create(dto);
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'return all trees' })
  @PaginateQueryOptions()
  @Get()
  async getVenues(@Paginate() query: PaginateQuery): Promise<Paginated<Venue>> {
    return this.venuesService.findAll(query);
  }

  @ApiOperation({ description: '상세보기' })
  @Get(':id')
  async getVenueById(@Param('id') id: number): Promise<Venue> {
    console.log(id);
    return await this.venuesService.findById(id, ['user', 'meetup']);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Meetup 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateVenueDto,
  ): Promise<Venue> {
    return await this.venuesService.update(id, dto);
  }
}
