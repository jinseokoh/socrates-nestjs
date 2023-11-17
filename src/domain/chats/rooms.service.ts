import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Room } from 'src/domain/chats/entities/room.entity';
import { CreateRoomDto } from 'src/domain/chats/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/chats/dto/update-room.dto';
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
      .innerJoinAndSelect('meetup.rooms', 'rooms')
      .innerJoinAndSelect('rooms.user', 'participant')
      .where('room.userId = :userId', { userId });
    // andWhere('room.isBanned', false)

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

  async findOneByIds(
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

  async update(dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOneByIds(dto.userId, dto.meetupId);
    if (!room) {
      throw new NotFoundException(`entity not found`);
    }
    if (dto.hasOwnProperty('lastReadMessageId')) {
      room.lastReadMessageId = dto.lastReadMessageId;
    }
    if (dto.hasOwnProperty('isBanned')) {
      room.isBanned = dto.isBanned;
    }
    if (dto.hasOwnProperty('isPaid')) {
      room.isPaid = dto.isPaid;
    }
    if (dto.hasOwnProperty('note')) {
      room.note = dto.note;
    }
    return await this.repository.save(room);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async remove(
    dto: Omit<
      CreateRoomDto,
      'lastReadMessageId' | 'partyType' | 'isPaid' | 'isBanned' | 'note'
    >,
  ): Promise<Room> {
    const room = await this.findOneByIds(dto.userId, dto.meetupId);
    return await this.repository.remove(room);
  }
}
