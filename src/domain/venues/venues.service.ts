import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

  async create(dto: CreateVenueDto): Promise<Venue> {
    const venue = this.repository.create(dto);
    return await this.repository.save(venue);
  }

  async findById(id: string, relations: string[] = []): Promise<Venue> {
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

  async update(id: string, dto: UpdateVenueDto): Promise<Venue> {
    const venue = await this.repository.preload({ id, ...dto });
    if (!venue) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(venue);
  }

  async remove(id: string): Promise<Venue> {
    const venue = await this.findById(id);
    return await this.repository.remove(venue);
  }
}
