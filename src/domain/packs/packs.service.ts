import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Article } from 'src/domain/articles/article.entity';
import { Artist } from 'src/domain/artists/artist.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import { CreatePackDto } from 'src/domain/packs/dto/create-pack.dto';
import { SyncPackAuctionsDto } from 'src/domain/packs/dto/sync-pack-auctions.dto';
import { SyncRelatedPacksDto } from 'src/domain/packs/dto/sync-related-packs.dto';
import { UpdatePackDto } from 'src/domain/packs/dto/update-pack.dto';
import { Pack } from 'src/domain/packs/pack.entity';
import { FindOneOptions, Repository } from 'typeorm';
@Injectable()
export class PacksService {
  constructor(
    @InjectRepository(Pack)
    private readonly repository: Repository<Pack>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
  ) {}

  async create(dto: CreatePackDto): Promise<Pack> {
    const entity = this.repository.create(dto);
    if (dto.auctionIds && dto.auctionIds.length) {
      const auctions = await this.auctionsRepository.findByIds(dto.auctionIds, {
        relations: ['artwork', 'articles'],
      });

      const artistIds = auctions.map((i) => i.artwork.artistId);
      const artists = await this.artistsRepository.findByIds([
        ...new Set(artistIds),
      ]);

      const nestedArticleIds = auctions.map((i) => i.articles.map((j) => j.id));
      const articleIds = [].concat(...nestedArticleIds);
      const articles = await this.articlesRepository.findByIds([
        ...new Set(articleIds),
      ]);

      const images = auctions.map((i) => i.images[0]);

      const startTime = new Date(
        Math.min(...auctions.map((i) => new Date(i.startTime).getTime())),
      );
      const endTime = new Date(
        Math.max(...auctions.map((i) => new Date(i.endTime).getTime())),
      );

      entity.auctions = auctions;
      entity.artists = artists;
      entity.articles = articles;
      entity.images = images;
      entity.startTime = startTime;
      entity.endTime = endTime;
      entity.total = articles.length;
    }
    return await this.repository.save(entity);
  }

  public findAll(query: PaginateQuery): Promise<Paginated<Pack>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title', 'summary'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
      },
    });
  }

  async findByIds(ids: number[]): Promise<Pack[]> {
    return this.repository.findByIds(ids);
  }

  async findById(id: number, relations: string[] = []): Promise<Pack> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<Pack> {
    return await this.repository.findOne(params);
  }

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
        // status: Not(Status.ENDED),
      },
    });
  }

  async update(id: number, dto: UpdatePackDto): Promise<Pack> {
    const pack = await this.repository.preload({ id, ...dto });
    if (!pack) {
      throw new NotFoundException(`pack #${id} not found`);
    }
    return await this.repository.save(pack);
  }

  async softRemove(id: number): Promise<Pack> {
    const pack = await this.findById(id);
    return await this.repository.softRemove(pack);
  }

  async remove(id: number): Promise<Pack> {
    const pack = await this.findById(id);
    return await this.repository.remove(pack);
  }

  //** extras

  async syncRelatedPacks(id: number, dto: SyncRelatedPacksDto): Promise<Pack> {
    const pack = await this.findById(id);

    const currentPacks = await this.repository
      .createQueryBuilder()
      .relation(Pack, 'relatedPacks')
      .of(pack)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Pack, 'relatedPacks')
      .of(pack)
      .remove(currentPacks);

    const packs = await this.repository.findByIds(dto.packIds);
    pack.relatedPacks = packs;
    return await this.repository.save(pack);
  }

  async syncPackAuctions(id: number, dto: SyncPackAuctionsDto): Promise<Pack> {
    const model = await this.findById(id);
    this._removePackAuctionsRelations(model);
    this._removePackArtistsRelations(model);
    this._removePackArticlesRelations(model);

    const auctions = await this.auctionsRepository.findByIds(dto.auctionIds, {
      relations: ['artwork', 'articles'],
    });

    const artistIds = auctions.map((i) => i.artwork.artistId);
    const artists = await this.artistsRepository.findByIds([
      ...new Set(artistIds),
    ]);

    const nestedArticleIds = auctions.map((i) => i.articles.map((j) => j.id));
    const articleIds = [].concat(...nestedArticleIds);
    const articles = await this.articlesRepository.findByIds([
      ...new Set(articleIds),
    ]);

    const images = auctions.map((i) => i.images[0]);

    const startTime = new Date(
      Math.min(...auctions.map((e) => new Date(e.startTime).getTime())),
    );
    const endTime = new Date(
      Math.min(...auctions.map((e) => new Date(e.endTime).getTime())),
    );

    model.auctions = auctions;
    model.artists = artists;
    model.articles = articles;
    model.images = images;
    model.startTime = startTime;
    model.endTime = endTime;

    return await this.repository.save(model);
  }

  async _removePackAuctionsRelations(pack: Pack): Promise<void> {
    const currentAuctions = await this.repository
      .createQueryBuilder()
      .relation(Pack, 'auctions')
      .of(pack)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Pack, 'auctions')
      .of(pack)
      .remove(currentAuctions);
  }

  async _removePackArtistsRelations(pack: Pack): Promise<void> {
    const currentArtists = await this.repository
      .createQueryBuilder()
      .relation(Pack, 'artists')
      .of(pack)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Pack, 'artists')
      .of(pack)
      .remove(currentArtists);
  }

  async _removePackArticlesRelations(pack: Pack): Promise<void> {
    const currentArticles = await this.repository
      .createQueryBuilder()
      .relation(Pack, 'articles')
      .of(pack)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Pack, 'articles')
      .of(pack)
      .remove(currentArticles);
  }
}
