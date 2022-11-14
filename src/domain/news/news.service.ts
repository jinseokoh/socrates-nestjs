import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateNewsDto } from 'src/domain/news/dto/create-news.dto';
import { UpdateNewsDto } from 'src/domain/news/dto/update-news.dto';
import { News } from 'src/domain/news/news.entity';
import { randomName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { Repository } from 'typeorm';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly repository: Repository<News>,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateNewsDto): Promise<News> {
    const news = this.repository.create(dto);
    return await this.repository.save(news);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // 공지사항 리스트 (관리자)
  async findAllExtended(query: PaginateQuery): Promise<Paginated<News>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title', 'isFixed'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [
        ['isFixed', 'DESC'],
        ['id', 'DESC'],
      ],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    });
  }

  // 공지사항 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<News>> {
    const queryBuilder = this.repository
      .createQueryBuilder('news')
      .where({ isPublished: true });

    const config: PaginateConfig<News> = {
      sortableColumns: ['id', 'title', 'isFixed'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [
        ['isFixed', 'DESC'],
        ['id', 'DESC'],
      ],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // 공지사항 상세보기
  async findById(id: number, relations: string[] = []): Promise<News> {
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

  async update(id: number, dto: UpdateNewsDto): Promise<News> {
    const news = await this.repository.preload({ id, ...dto });
    if (!news) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(news);
  }

  // image 갱신
  async upload(id: number, file: Express.Multer.File): Promise<News> {
    // see if id is valid
    await this.findById(id);
    const path = `local/news/${id}/${randomName('news')}`;
    try {
      // image processing using Jimp
      await this.s3Service.uploadWithResizing(file, path, 640);
    } catch (e) {
      console.log(e);
    }
    // upload the manipulated image to S3
    // update users table
    const image = `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
    return this.update(id, { image });
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<News> {
    const news = await this.findById(id);
    return await this.repository.remove(news);
  }
}
