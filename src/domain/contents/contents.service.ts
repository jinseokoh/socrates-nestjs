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
    private readonly contentRepository: Repository<Content>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateContentDto): Promise<Content> {
    return await this.contentRepository.save(
      this.contentRepository.create(dto),
    );
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Content 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<Content>> {
    const queryBuilder = this.contentRepository.createQueryBuilder('content');

    const config: PaginateConfig<Content> = {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title', 'body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        id: [FilterOperator.IN, FilterOperator.EQ],
        contentType: [FilterOperator.EQ],
        isPublished: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 상세보기
  async findById(id: number, relations: string[] = []): Promise<Content> {
    try {
      await this.increaseViewCount(id);
      return relations.length > 0
        ? await this.contentRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.contentRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // Content 리스트
  async loadContents(): Promise<Content[]> {
    return await this.contentRepository.createQueryBuilder('content').getMany();
  }

  // Content 리스트 by Slug
  async loadContentsBySlug(
    slug: string,
    relations: string[] = [],
  ): Promise<Content[]> {
    try {
      return relations.length > 0
        ? await this.contentRepository.find({
            where: { slug },
            relations,
          })
        : await this.contentRepository.find({
            where: { slug },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // async count(title: string): Promise<number> {
  //   return await this.contentRepository.count({
  //     where: {
  //       title,
  //     },
  //   });
  // }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateContentDto): Promise<Content> {
    const content = await this.contentRepository.preload({ id, ...dto });
    if (!content) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.contentRepository.save(content);
  }

  async increaseViewCount(id: number): Promise<void> {
    await this.contentRepository.manager.query(
      'UPDATE `content` SET viewCount = viewCount + 1 WHERE id = ?',
      [id],
    );
  }

  async increaseLikeCount(id: number): Promise<void> {
    await this.contentRepository.manager.query(
      'UPDATE `content` SET likeCount = likeCount + 1 WHERE id = ?',
      [id],
    );
  }

  async decreaseLikeCount(id: number): Promise<void> {
    await this.contentRepository.manager.query(
      'UPDATE `content` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
      [id],
    );
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Content> {
    const content = await this.findById(id);
    return await this.contentRepository.softRemove(content);
  }
}
