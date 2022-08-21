import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Artist } from 'src/domain/artists/artist.entity';
import { CreateArtistDto } from 'src/domain/artists/dto/create-artist.dto';
import { UpdateArtistDto } from 'src/domain/artists/dto/update-artist.dto';
import { FindOneOptions, Repository } from 'typeorm';
@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly repository: Repository<Artist>,
  ) {}

  async create(dto: CreateArtistDto): Promise<Artist> {
    const artist = this.repository.create(dto);
    return await this.repository.save(artist);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Artist>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'name'],
      searchableColumns: ['name', 'intro', 'credentials'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        genre: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Artist> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<Artist> {
    return await this.repository.findOne(params);
  }

  async update(id: number, dto: UpdateArtistDto): Promise<Artist> {
    const artist = await this.repository.preload({ id, ...dto });
    if (!artist) {
      throw new NotFoundException(`artist #${id} not found`);
    }
    return await this.repository.save(artist);
  }

  async remove(id: number): Promise<Artist> {
    const artist = await this.findById(id);
    return await this.repository.remove(artist);
  }
}
