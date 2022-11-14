import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { AnyData } from 'src/common/types/any-data.type';
import { Article } from 'src/domain/articles/article.entity';
import { CreateArticleDto } from 'src/domain/articles/dto/create-article.dto';
import { UpdateArticleDtoWithArticeAuctionsDtoArticleArticlesDto } from 'src/domain/articles/dto/update-article.dto';
import { Auction } from 'src/domain/auctions/auction.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';
@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateArticleDto): Promise<Article> {
    const article = this.repository.create(dto);
    return await this.repository.save(article);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Article 리스트 w/ Pagination
  async findAllExtended(query: PaginateQuery): Promise<Paginated<Article>> {
    const queryBuilder = await this.repository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.auctions', 'auction')
      .leftJoinAndSelect('article.relatedArticles', 'relatedArticle')
      .loadRelationCountAndMap('article.auctionCount', 'article.auctions')
      .loadRelationCountAndMap(
        'article.relatedArticleCount',
        'article.relatedArticles',
      );

    const config: PaginateConfig<Article> = {
      sortableColumns: [
        'id',
        'title',
        'category',
        'commentCount',
        'isPublished',
        'createdAt',
        'updatedAt',
      ],
      searchableColumns: ['title', 'subtitle'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // Article 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Article>> {
    const queryBuilder = await this.repository
      .createQueryBuilder('article')
      .where({ isPublished: true });

    const config: PaginateConfig<Article> = {
      sortableColumns: ['id', 'title', 'category'],
      searchableColumns: ['title', 'subtitle'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // Article 상세보기
  // Notice that in case there are tons of comments available to each
  // article, you don't wanna return all of them at once. But, since
  // we have a limited amount of comments, let me do this simple way.
  async findById(id: number, relations: string[] = []): Promise<Article> {
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

  async count(title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
      },
    });
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // Article 갱신
  // we need the following extra works here
  // - sync article with auctionIds
  // - sync aritcle with articleIds
  async update(
    id: number,
    dto: UpdateArticleDtoWithArticeAuctionsDtoArticleArticlesDto,
  ): Promise<Article> {
    if (dto.auctionIds && dto.auctionIds.length > 0) {
      await this.syncArticleAuctions(id, dto.auctionIds);
    }
    if (dto.articleIds && dto.articleIds.length > 0) {
      await this.syncArticleArticles(id, dto.articleIds);
    }
    const article = await this.repository.preload({ id, ...dto });
    if (!article) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(article);
  }

  // Article 이미지 저장후 URL (string) 리턴
  async uploadImage(id: number, file: Express.Multer.File): Promise<AnyData> {
    const path = `local/articles/${id}/${randomName('article', file.mimetype)}`;
    await this.s3Service.upload(file.buffer, path);

    return { data: `${process.env.AWS_CLOUDFRONT_URL}/${path}` };
  }

  // Article 이미지 삭제
  async deleteImages(id: number, urls: Array<string>): Promise<Article> {
    const article = await this.findById(id);
    const images = article.images.filter((url) => {
      return !urls.includes(url);
    });
    if (article.images.length !== images.length) {
      article.images.map(async (url) => {
        if (urls.includes(url)) {
          await this.s3Service.delete(url);
        }
      });
      return this.update(id, { images });
    }
    throw new NotFoundException(`file not found`);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Article> {
    const article = await this.findById(id);
    return await this.repository.softRemove(article);
  }

  async remove(id: number): Promise<Article> {
    const article = await this.findById(id);
    return await this.repository.remove(article);
  }

  //--------------------------------------------------------------------------//
  // Article/Auction Relationship
  //--------------------------------------------------------------------------//

  async syncArticleAuctions(
    id: number,
    auctionIds: number[],
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

    const auctions = await this.auctionsRepository.findByIds(auctionIds);
    article.auctions = auctions;
    return await this.repository.save(article);
  }

  async attachAuction(articleId: number, auctionId: number): Promise<any> {
    return await this.repository.manager.query(
      'INSERT IGNORE INTO `article_auction` (articleId, auctionId) VALUES (?, ?)',
      [articleId, auctionId],
    );
  }

  async detachAuction(articleId: number, auctionId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `article_auction` WHERE articleId = ? AND auctionId = ?',
      [articleId, auctionId],
    );
  }

  //--------------------------------------------------------------------------//
  // Article/Article Relationship
  //
  // notice that this is a same model many-to-many relationship.
  //
  // what it means is that there's only single unidirectional relation
  // definition in the model we can refer to, which is `relatedArticles`
  // in this case.
  //
  // defining a reverse relation would be possible but, using it in a
  // conventional way isn't ideal 'cause we need to combine the 2 different
  // result every time we need the relation.
  //
  // therefore, i've chosen to record the unidirectional relation data
  // twice. i.e. if article A is related to article B and C, you need to
  // add 4 different records to the pivot table instead of 2. namely,
  // - A and B
  // - A and C
  // - B and A
  // - C and A
  //
  // hope it makes sense to you as well.
  //--------------------------------------------------------------------------//

  // what we need to do is;
  // 1. get the relatedArticles for the id
  // 2. figure out the removedIds and detach each of them mutually
  // 3. fibure out the addedId, add attach each of them mutually

  async syncArticleArticles(
    id: number,
    articleIds: number[],
  ): Promise<Article> {
    // step #1
    const article = await this.findById(id);
    const currentArticles = await this.repository
      .createQueryBuilder()
      .relation(Article, 'relatedArticles')
      .of(article)
      .loadMany();
    const currentArticleIds = currentArticles.map((v) => v.id);
    // step #2
    const removedArticleIds = currentArticleIds.filter(
      (v) => !articleIds.includes(v),
    );
    removedArticleIds.map(async (v) => {
      await this.detachArticleIdsMutually(id, v);
    });
    // step #3
    const addedArticleIds = articleIds.filter(
      (v) => !currentArticleIds.includes(v),
    );
    addedArticleIds.map(async (v) => {
      await this.attachArticleIdsMutually(id, v);
    });

    return article;
  }

  async detachArticleIdsMutually(id1: number, id2: number): Promise<void> {
    await this.detachArticle(id1, id2);
    await this.detachArticle(id2, id1);
  }

  async attachArticleIdsMutually(id1: number, id2: number): Promise<void> {
    await this.attachArticle(id1, id2);
    await this.attachArticle(id2, id1);
  }

  async attachArticle(id1: number, id2: number): Promise<void> {
    await this.repository.manager.query(
      'INSERT IGNORE INTO `article_article` (articleId_1, articleId_2) VALUES (?, ?)',
      [id1, id2],
    );
  }

  async detachArticle(id1: number, id2: number): Promise<void> {
    await this.repository.manager.query(
      'DELETE FROM `article_article` WHERE articleId_1 = ? AND articleId_2 = ?',
      [id1, id2],
    );
  }
}
