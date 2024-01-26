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

  // 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<Content>> {
    const queryBuilder = this.repository.createQueryBuilder('content');

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

  // Dot 리스트
  async getActiveContents(): Promise<Content[]> {
    return await this.repository.find({
      where: {
        isPublished: true,
      },
    });
  }

  // 상세보기
  async findById(id: number, relations: string[] = []): Promise<Content> {
    try {
      await this.increaseViewCount(id);
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

  // async findBySlug(slug: string, relations: string[] = []): Promise<Content> {
  //   try {
  //     return relations.length > 0
  //       ? await this.repository.findOneOrFail({
  //           where: { slug },
  //           relations,
  //         })
  //       : await this.repository.findOneOrFail({
  //           where: { slug },
  //         });
  //   } catch (e) {
  //     throw new NotFoundException('entity not found');
  //   }
  // }

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

  async increaseViewCount(id: number): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `content` SET viewCount = viewCount + 1 WHERE id = ?',
      [id],
    );
  }

  async increaseLikeCount(id: number): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `content` SET likeCount = likeCount + 1 WHERE id = ?',
      [id],
    );
  }

  async decreaseLikeCount(id: number): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `content` SET likeCount = likeCount - 1 WHERE id = ? AND likeCount > 0',
      [id],
    );
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Content> {
    const content = await this.findById(id);
    return await this.repository.remove(content);
  }
}
