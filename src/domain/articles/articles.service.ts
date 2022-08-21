import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Article } from 'src/domain/articles/article.entity';
import { CreateArticleDto } from 'src/domain/articles/dto/create-article.dto';
import { SyncArticleAuctionsDto } from 'src/domain/articles/dto/sync-article-auctions.dto';
import { SyncRelatedArticlesDto } from 'src/domain/articles/dto/sync-related-articles.dto';
import { UpdateArticleDto } from 'src/domain/articles/dto/update-article.dto';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
  ) {}

  async create(dto: CreateArticleDto): Promise<Article> {
    const article = this.repository.create(dto);
    return await this.repository.save(article);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Article>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title', 'category'],
      searchableColumns: ['title', 'subtitle', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Article> {
    //! i forgot why i had to update commentCount this coarse way.
    //! it looks unnecessary. so, i am commenting this block out.
    // if (relations.length > 0) {
    //   const article = await this.repository.findOneOrFail({
    //     where: { id },
    //     relations,
    //   });
    //   article.commentCount = article.articleComments.length;
    //   return article;
    // }
    // return await this.repository.findOneOrFail({
    //   where: { id },
    // });
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
      },
    });
  }

  async update(id: number, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.repository.preload({ id, ...dto });
    if (!article) {
      throw new NotFoundException(`article #${id} not found`);
    }
    return await this.repository.save(article);
  }

  async softRemove(id: number): Promise<Article> {
    const article = await this.findById(id);
    return await this.repository.softRemove(article);
  }

  async remove(id: number): Promise<Article> {
    const article = await this.findById(id);
    return await this.repository.remove(article);
  }

  //** extras

  async syncRelatedArticles(
    id: number,
    dto: SyncRelatedArticlesDto,
  ): Promise<Article> {
    const article = await this.findById(id);

    const currentArticles = await this.repository
      .createQueryBuilder()
      .relation(Article, 'relatedArticles')
      .of(article)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Article, 'relatedArticles')
      .of(article)
      .remove(currentArticles);

    const articles = await this.repository.findByIds(dto.articleIds);
    article.relatedArticles = articles;
    return await this.repository.save(article);
  }

  async syncArticleAuctions(
    id: number,
    dto: SyncArticleAuctionsDto,
  ): Promise<Article> {
    const article = await this.findById(id);

    const currentAuctions = await this.repository
      .createQueryBuilder()
      .relation(Article, 'auctions')
      .of(article)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Article, 'auctions')
      .of(article)
      .remove(currentAuctions);

    const auctions = await this.auctionsRepository.findByIds(dto.auctionIds);
    article.auctions = auctions;
    return await this.repository.save(article);
  }

  async attach(articleId: number, auctionId: number): Promise<any> {
    return await this.repository.manager.query(
      'INSERT IGNORE INTO `article_auction` (articleId, auctionId) VALUES (?, ?)',
      [articleId, auctionId],
    );
  }

  async detach(articleId: number, auctionId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `article_auction` WHERE articleId = ? AND auctionId = ?',
      [articleId, auctionId],
    );
  }
}
