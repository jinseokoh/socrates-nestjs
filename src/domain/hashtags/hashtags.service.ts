import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
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
    const item = await this.repository.findOne({
      order: { id: 'DESC' },
    });
    const key = (item?.id ?? 0) + 1;
    const hashtag = this.repository.create({
      ...dto,
      title: `${dto.title}-${key}`,
      key: `${dto.key}-${key}`,
    });
    return await this.repository.save(hashtag);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Hashtag>> {
    const queryBuilder = this.repository
      .createQueryBuilder('hashtag')
      .leftJoinAndSelect('hashtag.children', 'children')
      .andWhere('hashtag.parentId IS NULL');

    const config: PaginateConfig<Hashtag> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        key: [FilterOperator.EQ],
      },
    };

    return await paginate<Hashtag>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Hashtag> {
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

  async update(id: number, dto: UpdateHashtagDto): Promise<Hashtag> {
    const hashtag = await this.repository.preload({ id, ...dto });
    if (!hashtag) {
      throw new NotFoundException(`entity not found`);
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
