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
import { LedgerType } from 'src/common/enums';
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

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateRoomDto): Promise<Room> {
    return await this.repository.save(this.repository.create(dto));
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

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

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

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
  //? 코인 비용 발생
  //! balance will automatically be updated w/ Ledger model event subscriber.
  //! do not try to update it manually. perform a transaction using query runner
  async payRoomFee(dto: ChangeRoomIsPaidDto): Promise<Room> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

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
      if (!user) {
        throw new NotFoundException(`user not found`);
      }
      if (!room) {
        throw new NotFoundException(`room not found`);
      }
      if (
        user.profile?.balance === null ||
        user.profile?.balance - dto.costToUpdate < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }

      const newBalance = user.profile?.balance - dto.costToUpdate;
      user.profile.balance = newBalance;

      const ledger = new Ledger({
        credit: dto.costToUpdate,
        ledgerType: LedgerType.CREDIT_SPEND,
        balance: newBalance,
        note: `채팅방 입장료 (모임 #${dto.meetupId})`,
        userId: dto.userId,
      });
      await queryRunner.manager.save(ledger);
      room.isPaid = true;
      room.user = user;
      await queryRunner.manager.save(room);
      // commit transaction now:
      await queryRunner.commitTransaction();

      return room;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async remove(id: number, userId: number): Promise<Room> {
    try {
      const room = await this.repository.findOneOrFail({
        where: { id },
      });
      console.log(room);
      if (room.userId == userId) {
        //! as opposed to softRemove, remove drops id in response.
        await this.repository.remove(room);
        room.id = 0; // to prevent hydration error on a flutter client
        return room;
      } else {
        throw new BadRequestException('doh! mind your id');
      }
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }
}
