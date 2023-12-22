import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateRemarkDto } from 'src/domain/connections/dto/create-remark.dto';

import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Remark } from 'src/domain/connections/entities/remark.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateRemarkDto } from 'src/domain/connections/dto/update-remark.dto';

@Injectable()
export class RemarksService {
  constructor(
    @InjectRepository(Remark)
    private readonly repository: Repository<Remark>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    // @Inject(SlackService) private readonly slack: SlackService,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateRemarkDto): Promise<Remark> {
    // validation
    try {
      const connection = await this.connectionRepository.findOneOrFail({
        where: {
          id: dto.connectionId,
        },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
    // creation
    const remark = await this.repository.save(this.repository.create(dto));
    // fetch remark w/ user to emit SSE
    const remarkWithUser = await this.findById(remark.id, ['user']);
    console.log('remarkWithUser', remarkWithUser);
    // emit SSE
    this.redisClient.emit('sse.add_connection', remarkWithUser);

    // const connectionTitle = connection.title.replace(/[\<\>]/g, '');
    // await this.slack.postMessage({
    //   channel: 'major',
    //   text: `[${process.env.NODE_ENV}-api] 📝 댓글 : <${process.env.ADMIN_URL}/connections/show/${connection.id}|${connectionTitle}>`,
    // });
    return remarkWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(
    connectionId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    const queryBuilder = this.repository
      .createQueryBuilder('remark')
      .innerJoinAndSelect('remark.user', 'user')
      .where('remark.connection = :connectionId', { connectionId });

    const config: PaginateConfig<Remark> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Remark>(query, queryBuilder, config);
  }

  async findAllById(
    connectionId: number,
    remarkId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Remark>> {
    const queryBuilder = this.repository
      .createQueryBuilder('remark')
      .leftJoinAndSelect('remark.user', 'user')
      .where('remark.connectionId = :connectionId', { connectionId })
      .andWhere('remark.parentId = :remarkId', { remarkId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('remark.id = :remarkId', { remarkId }).orWhere(
      //       'remark.parentId = :remarkId',
      //       { remarkId },
      //     );
      //   }),
      // )
      .andWhere('remark.deletedAt IS NULL');

    const config: PaginateConfig<Remark> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<Remark>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Remark> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Remark | null> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateRemarkDto): Promise<Remark> {
    const remark = await this.repository.preload({ id, ...dto });
    if (!remark) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(remark);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Remark> {
    const remark = await this.findById(id);
    return await this.repository.softRemove(remark);
  }

  async remove(id: number): Promise<Remark> {
    const remark = await this.findById(id);
    return await this.repository.remove(remark);
  }
}
