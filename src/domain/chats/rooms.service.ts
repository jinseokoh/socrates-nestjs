import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
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
import { DataSource, In, Repository } from 'typeorm';
import { Participant } from 'src/domain/chats/entities/participant.entity';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateRoomDto): Promise<Room> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    const sortedIds = [...dto.ids].sort((a, b) => a - b);
    const slug = `${dto.prefix}-${sortedIds.join('-')}`;
    const total = dto.ids.length;

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const users = await queryRunner.manager.find(User, {
        where: {
          id: In(dto.ids),
        },
        relations: ['profile'],
      });
      if (total > users.length) {
        throw new NotFoundException('user not found');
      }

      const balance = users.find((v) => v.id === dto.userId)?.profile?.balance;
      if (balance === null || balance - dto.cost < 0) {
        throw new BadRequestException(`insufficient balance`);
      }

      const room = await queryRunner.manager.save(
        new Room({
          slug: slug,
          title: `사용자 ${total}인: ${users.map((v) => v.username).join(',')}`,
          total: total,
        }),
      );
      room.participants = dto.ids.map((id: number) => {
        return new Participant({
          userId: id,
          roomId: room.id,
          partyType: dto.userId === id ? PartyType.HOST : PartyType.GUEST,
        });
      });
      await queryRunner.manager.save(room);

      if (dto.cost > 0) {
        const newBalance = balance - dto.cost;
        await queryRunner.manager.save(
          new Ledger({
            credit: dto.cost,
            ledgerType: LedgerType.CREDIT_SPEND,
            balance: newBalance,
            note: `대화방 생성 (room #${room.id})`,
            userId: dto.userId,
          }),
        );
      }
      // commit transaction now:
      await queryRunner.commitTransaction();

      return room;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
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
      .innerJoinAndSelect(
        Participant,
        'participant',
        'participant.roomId = room.id',
      )
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'participantUser')
      // .addSelect(['room.*'])
      .where('participant.userId = :userId', { userId });

    const config: PaginateConfig<Room> = {
      sortableColumns: ['id', 'updatedAt'],
      defaultLimit: 20,
      defaultSortBy: [['updatedAt', 'DESC']],
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

  async findByParticipantIds(ids: number[]): Promise<Room> {
    try {
      return this.roomRepository.findOneOrFail({
        where: [],
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
