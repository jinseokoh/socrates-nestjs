import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateProviderDto } from 'src/domain/users/dto/create-provider.dto';
import { UpdateProviderDto } from 'src/domain/users/dto/update-provider.dto';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly repository: Repository<Provider>,
  ) {}

  async create(dto: CreateProviderDto): Promise<Provider> {
    const provider = this.repository.create(dto);
    return await this.repository.save(provider);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Provider>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'providerName'],
      searchableColumns: ['providerName'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  async findById(id: string, relations: string[] = []): Promise<Provider> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Provider> {
    return await this.repository.findOne(params);
  }

  async update(id: string, dto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.repository.preload({ id, ...dto });
    if (!provider) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(provider);
  }

  async remove(id: string): Promise<Provider> {
    const provider = await this.findById(id);
    return await this.repository.remove(provider);
  }
}
