import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateSecretDto } from 'src/domain/secrets/dto/create-secret.dto';
import { UpdateSecretDto } from 'src/domain/secrets/dto/update-secret.dto';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { Repository } from 'typeorm';
@Injectable()
export class SecretsService {
  constructor(
    @InjectRepository(Secret)
    private readonly repository: Repository<Secret>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateSecretDto): Promise<Secret> {
    return await this.repository.save(this.repository.create(dto));
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // OTP 비밀번호 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<Secret>> {
    const config: PaginateConfig<Secret> = {
      sortableColumns: ['key'],
      searchableColumns: ['key'],
      defaultSortBy: [],
      filterableColumns: {
        key: [FilterOperator.IN, FilterOperator.EQ],
      },
    };

    return await paginate(query, this.repository, config);
  }

  // OTP 비밀번호 상세보기
  async findByKey(key: string): Promise<Secret | null> {
    return await this.repository.findOne({
      where: { key },
    });
  }

  async count(key: string): Promise<number> {
    return await this.repository.count({
      where: { key },
    });
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateSecretDto): Promise<Secret> {
    const secret = await this.repository.preload({ id, ...dto });
    if (!secret) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(secret);
  }

  async updateByKey(key: string, dto: UpdateSecretDto): Promise<Secret> {
    const secret = await this.findByKey(key);
    secret.otp = dto.otp;
    return await this.repository.save(secret);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(key: string): Promise<Secret> {
    const secret = await this.findByKey(key);
    return await this.repository.remove(secret);
  }
}
