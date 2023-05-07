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
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateRoomDto } from 'src/domain/rooms/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/rooms/dto/update-room.dto';
import { Room } from 'src/domain/rooms/entities/room.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly repository: Repository<Room>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateRoomDto): Promise<Room> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: dto.hostId },
    });
    if (user.isBanned) {
      throw new BadRequestException(`not allowed to use`);
    }

    return await this.repository.save(this.repository.create(dto));
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Room>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        title: [FilterOperator.EQ],
      },
      // relations: ['host', 'guest'],
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Room> {
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

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.repository.preload({ id, ...dto });
    if (!room) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(room);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Room> {
    const room = await this.findById(id);
    return await this.repository.softRemove(room);
  }

  async remove(id: number): Promise<Room> {
    const room = await this.findById(id);
    return await this.repository.remove(room);
  }
}
