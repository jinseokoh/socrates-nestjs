import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { CreateHashtagDto } from 'src/domain/hashtags/dto/create-hashtag.dto';
import { SyncHashtagArtworksDto } from 'src/domain/hashtags/dto/sync-hashtag-artworks.dto';
import { UpdateHashtagDto } from 'src/domain/hashtags/dto/update-hashtag.dto';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { Repository } from 'typeorm';
@Injectable()
export class HashtagsService {
  constructor(
    @InjectRepository(Hashtag)
    private readonly repository: Repository<Hashtag>,
    @InjectRepository(Artwork)
    private readonly artworksRepository: Repository<Artwork>,
  ) {}

  async create(dto: CreateHashtagDto): Promise<Hashtag> {
    const hashtag = this.repository.create(dto);
    return await this.repository.save(hashtag);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Hashtag>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'name'],
      searchableColumns: ['name', 'slug'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        slug: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Hashtag> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async update(id: number, dto: UpdateHashtagDto): Promise<Hashtag> {
    const hashtag = await this.repository.preload({ id, ...dto });
    if (!hashtag) {
      throw new NotFoundException(`hashtag #${id} not found`);
    }
    return await this.repository.save(hashtag);
  }

  // keep in mind that we don't necessarily have soft-delete API on hashtag
  async remove(id: number): Promise<Hashtag> {
    const hashtag = await this.findById(id);
    return await this.repository.remove(hashtag);
  }

  //** extras

  async sync(id: number, dto: SyncHashtagArtworksDto): Promise<Hashtag> {
    const hashtag = await this.findById(id);
    const currentArtworks = await this.repository
      .createQueryBuilder()
      .relation(Hashtag, 'artworks')
      .of(hashtag)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Hashtag, 'artworks')
      .of(hashtag)
      .remove(currentArtworks);

    const artworks = await this.artworksRepository.findByIds(dto.ids);
    hashtag.artworks = artworks;
    return await this.repository.save(hashtag);
  }

  async attach(hashtagId: number, artworkId: number): Promise<any> {
    return await this.repository.manager.query(
      'INSERT IGNORE INTO `hashtag_artwork` (hashtagId, artworkId) VALUES (?, ?)',
      [hashtagId, artworkId],
    );
  }

  async detach(hashtagId: number, artworkId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `hashtag_artwork` WHERE hashtagId = ? AND artworkId = ?',
      [hashtagId, artworkId],
    );
  }
}
