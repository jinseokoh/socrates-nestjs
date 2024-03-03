import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/users/entities/plea.entity';
import { CreatePleaDto } from 'src/domain/users/dto/create-plea.dto';
import { DataSource } from 'typeorm';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { LedgerType, PleaStatus } from 'src/common/enums';
import { UpdatePleaDto } from 'src/domain/users/dto/update-plea.dto';

@Injectable()
export class UsersPleaService {
  private readonly logger = new Logger(UsersPleaService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    private dataSource: DataSource, // for transaction
  ) {}

  //?-------------------------------------------------------------------------//
  //? Plea Pivot
  //?-------------------------------------------------------------------------//

  //--------------------------------------------------------------------------//
  // Create
  //--------------------------------------------------------------------------//

  //! balance will be adjusted w/ ledger model event subscriber.
  //! starts a new transaction using query runner.
  //! for hated(blocked) users, app needs to take care of 'em instead of server.
  async createPlea(dto: CreatePleaDto): Promise<Plea> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const friendshipCount = await queryRunner.manager.count(Plea, {
      where: [
        { senderId: dto.senderId, recipientId: dto.recipientId },
        { senderId: dto.recipientId, recipientId: dto.senderId },
      ],
    });
    const sender = await queryRunner.manager.findOne(User, {
      where: { id: dto.senderId },
      relations: [`profile`],
    });
    await queryRunner.startTransaction();

    try {
      if (friendshipCount > 0) {
        throw new UnprocessableEntityException(`already in a relationship`);
        // throw new UnprocessableEntityException(`entity already exists`);
      }
      if (sender?.isBanned) {
        throw new UnprocessableEntityException(`the user is banned`);
      }
      if (
        sender.profile?.balance === null ||
        sender.profile?.balance - dto.reward < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }

      const newBalance = sender.profile?.balance - dto.reward;
      const ledger = new Ledger({
        credit: dto.reward,
        ledgerType: LedgerType.CREDIT_ESCROW,
        balance: newBalance,
        note: `요청 격려금 (user #${dto.senderId})`,
        userId: dto.senderId,
      });
      await queryRunner.manager.save(ledger);

      const plea = await queryRunner.manager.save(
        this.pleaRepository.create(dto),
      );
      await queryRunner.commitTransaction();

      return plea;
    } catch (err) {
      // console.log(err.code);
      await queryRunner.rollbackTransaction();

      if (err.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity already exists`);
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  //--------------------------------------------------------------------------//
  // Read
  //--------------------------------------------------------------------------//

  async getMyReceivedPleas(myId: number, userId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .innerJoinAndSelect('plea.dot', 'dot')
      .where({
        senderId: userId,
        recipientId: myId,
      })
      .getMany();

    return items;
  }

  async getMySentPleas(myId: number, userId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .innerJoinAndSelect('plea.dot', 'dot')
      .where({
        senderId: myId,
        recipientId: userId,
      })
      .getMany();

    return items;
  }

  async findByIds(senderId: number, recipientId: number): Promise<Plea[]> {
    try {
      return await this.pleaRepository.find({
        where: { senderId, recipientId },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //--------------------------------------------------------------------------//
  // Update
  //--------------------------------------------------------------------------//

  async update(id: number, dto: UpdatePleaDto): Promise<Plea> {
    const plea = await this.pleaRepository.preload({ id, ...dto });
    if (!plea) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(plea);
  }

  //--------------------------------------------------------------------------//
  // Delete
  //--------------------------------------------------------------------------//

  async deletePleas(senderId: number, recipientId: number): Promise<void> {
    console.log('delete pleas');
    const pleas = await this.findByIds(senderId, recipientId);

    console.log(pleas);
    await Promise.all(
      pleas.map(async (v: Plea) => await this.repository.softDelete(v.id)),
    );
  }

  //--------------------------------------------------------------------------//

  async getUniqueUsersPleaded(userId: number): Promise<User[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .where({
        recipientId: userId,
      })
      .groupBy('plea.senderId')
      .getMany();

    return items.map((v) => v.sender);
  }
}
