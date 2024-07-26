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
import { LedgerType, PartyType } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateRoomDto): Promise<Room> {
    return await this.roomRepository.save(this.roomRepository.create(dto));
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  async findAllByUserId(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Room>> {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .innerJoinAndSelect('room.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
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

  async findById(id: number, relations: string[] = []): Promise<Room> {
    try {
      return relations.length > 0
        ? await this.roomRepository.findOneOrFail({
            where: { id: id },
            relations,
          })
        : await this.roomRepository.findOneOrFail({
            where: { id: id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.roomRepository.preload({ id, ...dto });
    if (!room) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.roomRepository.save(room);
  }

  // //? Participant 의 isPaid 값 갱신
  // //? 코인 비용 발생
  // //! balance will automatically be updated w/ Ledger model event subscriber.
  // //! do not try to update it manually. perform a transaction using query runner
  // async payRoomFee(
  //   userId: number,
  //   roomId: number,
  //   cost: number,
  // ): Promise<Room> {
  //   // create a new query runner
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   try {
  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();

  //     const user = await queryRunner.manager.findOne(User, {
  //       where: { id: userId },
  //       relations: [`profile`],
  //     });
  //     const room = await queryRunner.manager.findOne(Room, {
  //       where: {
  //         id: roomId,
  //       },
  //     });
  //     if (!user) {
  //       throw new NotFoundException(`user not found`);
  //     }
  //     if (!room) {
  //       throw new NotFoundException(`room not found`);
  //     }
  //     if (user.profile?.balance === null || user.profile?.balance - cost < 0) {
  //       throw new BadRequestException(`insufficient balance`);
  //     }

  //     const newBalance = user.profile?.balance - cost;
  //     user.profile.balance = newBalance;

  //     const ledger = new Ledger({
  //       credit: cost,
  //       ledgerType: LedgerType.CREDIT_SPEND,
  //       balance: newBalance,
  //       note: `채팅방 입장료 (room #${roomId})`,
  //       userId: userId,
  //     });
  //     await queryRunner.manager.save(ledger);
  //     room.isPaid = true;
  //     room.user = user;
  //     await queryRunner.manager.save(room);
  //     // commit transaction now:
  //     await queryRunner.commitTransaction();

  //     return room;
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async remove(id: number, userId: number): Promise<void> {
    try {
      const room = await this.findById(id, ['participants']);
      const isHost = room.participants.some(
        (v) => v.userId === userId && v.partyType === PartyType.HOST,
      );
      if (isHost) {
        await this.roomRepository.remove(room);
      } else {
        throw new BadRequestException('doh! mind your id');
      }
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }
}
