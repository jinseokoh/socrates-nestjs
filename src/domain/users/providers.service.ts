import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateQuery,
  Paginated,
  paginate,
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

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateProviderDto): Promise<Provider> {
    const provider = this.repository.create(dto);
    return await this.repository.save(provider);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

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

  async findById(id: number, relations: string[] = []): Promise<Provider> {
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

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.repository.preload({ id, ...dto });
    if (!provider) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(provider);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(id: number): Promise<Provider> {
    const provider = await this.findById(id);
    return await this.repository.remove(provider);
  }
}
