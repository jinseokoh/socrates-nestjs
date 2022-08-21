import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateNewsDto } from 'src/domain/news/dto/create-news.dto';
import { UpdateNewsDto } from 'src/domain/news/dto/update-news.dto';
import { News } from 'src/domain/news/news.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly repository: Repository<News>,
  ) {}

  async create(dto: CreateNewsDto): Promise<News> {
    const news = this.repository.create(dto);
    return await this.repository.save(news);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<News>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isPublished: [FilterOperator.EQ],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<News> {
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

  async update(id: number, dto: UpdateNewsDto): Promise<News> {
    const news = await this.repository.preload({ id, ...dto });
    if (!news) {
      throw new NotFoundException(`news #${id} not found`);
    }
    return await this.repository.save(news);
  }

  async remove(id: number): Promise<News> {
    const news = await this.findById(id);
    return await this.repository.remove(news);
  }
}
