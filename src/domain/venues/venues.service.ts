import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateVenueDto } from 'src/domain/venues/dto/create-venue.dto';
import { UpdateVenueDto } from 'src/domain/venues/dto/update-venue.dto';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { Repository } from 'typeorm';
@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private readonly repository: Repository<Venue>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateVenueDto): Promise<Venue> {
    const venue = this.repository.create(dto);
    return await this.repository.save(venue);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Meetup 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Venue>> {
    const queryBuilder = this.repository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<Venue> = {
      sortableColumns: ['name'],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Venue> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateVenueDto): Promise<Venue> {
    const venue = await this.repository.preload({ id, ...dto });
    if (!venue) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(venue);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Venue> {
    const venue = await this.findById(id);
    return await this.repository.remove(venue);
  }
}
