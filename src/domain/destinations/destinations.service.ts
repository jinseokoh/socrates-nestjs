import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Destination } from 'src/domain/destinations/destination.entity';
import { CreateDestinationDto } from 'src/domain/destinations/dto/create-destination.dto';
import { UpdateDestinationDto } from 'src/domain/destinations/dto/update-destination.dto';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly repository: Repository<Destination>,
  ) {}

  async create(dto: CreateDestinationDto): Promise<Destination> {
    const count = await this.count(dto.userId, dto.title);
    if (count > 0) {
      throw new BadRequestException('duplicate title exists');
      return;
    }

    const destination = this.repository.create(dto);
    return await this.repository.save(destination);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Destination>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title'],
      searchableColumns: ['title'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Destination> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Destination> {
    return await this.repository.findOne(params);
  }

  async count(userId: number, title: string): Promise<number> {
    return await this.repository.count({
      where: {
        title,
        userId,
      },
    });
  }

  async update(id: number, dto: UpdateDestinationDto): Promise<Destination> {
    const destination = await this.repository.preload({ id, ...dto });
    if (!destination) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(destination);
  }

  async remove(id: number): Promise<Destination> {
    const destination = await this.findById(id);
    return await this.repository.remove(destination);
  }

  // 내가 작성한 소장품
  async getMyDestinations(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Destination>> {
    const queryBuilder = this.repository
      .createQueryBuilder('destination')
      .where('destination.userId = :userId', { userId });

    const config: PaginateConfig<Destination> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isDefault: [FilterOperator.EQ],
      },
    };

    return paginate(query, queryBuilder, config);
  }

  // 내가 작성한 소장품
  async makeDefault(userId: number, destinationId: number): Promise<any> {
    console.log(userId, destinationId, '<-- userid, destinid,');

    await this.repository
      .createQueryBuilder()
      .update(Destination)
      .where('userId = :userId', { userId })
      .set({ isDefault: false })
      .execute();

    return await this.repository
      .createQueryBuilder()
      .update(Destination)
      .where('id = :destinationId', { destinationId })
      .set({ isDefault: true })
      .execute();
  }
}
