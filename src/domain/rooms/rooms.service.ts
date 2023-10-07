import {
  BadRequestException,
  Injectable,
  Logger,
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
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Room } from 'src/domain/rooms/entities/room.entity';
import { CreateRoomDto } from 'src/domain/rooms/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/rooms/dto/update-room.dto';
import { Repository } from 'typeorm';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly repository: Repository<Room>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateRoomDto): Promise<Room> {
    return await this.repository.save(this.repository.create(dto));
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAllByUserId(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Room>> {
    const queryBuilder = this.repository
      .createQueryBuilder('room')
      .innerJoinAndSelect('room.user', 'user')
      .innerJoinAndSelect('room.meetup', 'meetup')
      .where('room.userId = :userId', { userId });

    const config: PaginateConfig<Room> = {
      sortableColumns: ['createdAt'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Room>(query, queryBuilder, config);
  }

  async findByIds(
    userId: number,
    meetupId: number,
    relations: string[] = [],
  ): Promise<Room> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { userId, meetupId },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { userId, meetupId },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  //! todo. this need to be taken care of later.
  async update(
    userId: number,
    meetupId: number,
    dto: UpdateRoomDto,
  ): Promise<Room> {
    const room = await this.findByIds(dto.userId, dto.meetupId);
    if (!room) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(room);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(userId: number, meetupId: number): Promise<Room> {
    const room = await this.findByIds(userId, meetupId);
    return await this.repository.softRemove(room);
  }

  async remove(userId: number, meetupId: number): Promise<Room> {
    const room = await this.findByIds(userId, meetupId);
    return await this.repository.remove(room);
  }
}
