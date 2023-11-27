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
import { Room } from 'src/domain/chats/entities/room.entity';
import { CreateRoomDto } from 'src/domain/chats/dto/create-room.dto';
import { UpdateRoomDto } from 'src/domain/chats/dto/update-room.dto';
import { Ledger as LedgerType } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import { ChangeRoomIsPaidDto } from 'src/domain/chats/dto/change-room-is-paid.dto';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly repository: Repository<Room>,
    private dataSource: DataSource, // for transaction
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
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('meetup.rooms', 'rooms')
      .leftJoinAndSelect('rooms.user', 'participant')
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
    if (dto.hasOwnProperty('isPaid')) {
      room.isPaid = dto.isPaid;
    }
    if (dto.hasOwnProperty('isEndedd')) {
      room.isEnded = dto.isEnded;
    }
    if (dto.hasOwnProperty('isBanned')) {
      room.isBanned = dto.isBanned;
    }
    if (dto.hasOwnProperty('lastMessageId')) {
      room.lastMessageId = dto.lastMessageId;
    }
    if (dto.hasOwnProperty('lastMessage')) {
      room.lastMessage = dto.lastMessage;
    }
    if (dto.hasOwnProperty('appointedAt')) {
      room.appointedAt = dto.appointedAt;
    }
    return await this.repository.save(room);
  }

  //? Room isPaid 값 갱신
  //? 코인 비용이 발생할 수 있음.
  //! balance will be adjusted w/ model event subscriber.
  //! using transaction using query runner
  async payRoomFee(dto: ChangeRoomIsPaidDto): Promise<Room> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const user = await queryRunner.manager.findOne(User, {
      where: { id: dto.userId },
      relations: [`profile`],
    });
    const room = await queryRunner.manager.findOne(Room, {
      where: {
        meetupId: dto.meetupId,
        userId: dto.userId,
      },
    });
    const newBalance = user.profile?.balance - dto.costToUpdate;

    await queryRunner.startTransaction();
    try {
      if (!user) {
        throw new NotFoundException(`the user is not found`);
      }
      if (!room) {
        throw new NotFoundException(`the room is not found`);
      }
      if (
        user.profile?.balance === null ||
        user.profile?.balance - dto.costToUpdate < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }
      const ledger = new Ledger({
        credit: dto.costToUpdate,
        ledgerType: LedgerType.CREDIT_SPEND,
        balance: newBalance,
        note: `채팅방 입장료 (meetup #${dto.meetupId}, user #${dto.userId})`,
        userId: dto.userId,
      });
      await queryRunner.manager.save(ledger);
      room.isPaid = true;
      await queryRunner.manager.save(room);
      // commit transaction now:
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return { ...room, isPaid: true, user: user };
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
