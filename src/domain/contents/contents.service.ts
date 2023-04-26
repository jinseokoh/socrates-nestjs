import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateContentDto } from 'src/domain/contents/dto/create-content.dto';
import { UpdateContentDto } from 'src/domain/contents/dto/update-content.dto';
import { Content } from 'src/domain/contents/entities/content.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private readonly repository: Repository<Content>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateContentDto): Promise<Content> {
    return await this.repository.save(this.repository.create(dto));
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // 공지사항 리스트 (관리자)
  async findAllExtended(query: PaginateQuery): Promise<Paginated<Content>> {
    return await paginate(query, this.repository, {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    });
  }

  // 공지사항 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<Content>> {
    const queryBuilder = this.repository
      .createQueryBuilder('content')
      .where({ isPublished: true });

    const config: PaginateConfig<Content> = {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        category: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 공지사항 상세보기
  async findById(id: number, relations: string[] = []): Promise<Content> {
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

  async findBySlug(slug: string, relations: string[] = []): Promise<Content> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { slug },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { slug },
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

  async update(id: number, dto: UpdateContentDto): Promise<Content> {
    const content = await this.repository.preload({ id, ...dto });
    if (!content) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(content);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Content> {
    const content = await this.findById(id);
    return await this.repository.remove(content);
  }
}
