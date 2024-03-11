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
import { FriendshipStatus, LedgerType, PleaStatus } from 'src/common/enums';
import { UpdatePleaDto } from 'src/domain/users/dto/update-plea.dto';
import { Friendship } from 'src/domain/users/entities/friendship.entity';

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

  //? ------------------------------------------------------------------------//
  //? Plea Pivot
  //? ------------------------------------------------------------------------//

  // -------------------------------------------------------------------------//
  // Create
  // -------------------------------------------------------------------------//

  //! profile's balance will be adjusted w/ ledger model event subscriber.
  //! - starts a new transaction using data source and query runner.
  //! - for hated(blocked) users, client needs to take care of 'em. (instead of server.)
  async createPlea(dto: CreatePleaDto): Promise<Plea> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // validation checks
    const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
      where: [
        { senderId: dto.senderId, recipientId: dto.recipientId },
        { senderId: dto.recipientId, recipientId: dto.senderId },
      ],
    });
    if (friendship) {
      if (friendship.status === FriendshipStatus.ACCEPTED) {
        throw new UnprocessableEntityException(`already in a relationship`);
      } else {
        // friendship already exists
        throw new UnprocessableEntityException(`entity already exists`);
      }
    }

    // validation checks
    const sender = await queryRunner.manager.findOneOrFail(User, {
      where: { id: dto.senderId },
      relations: [`profile`],
    });
    if (sender?.isBanned) {
      throw new UnprocessableEntityException(`the user is banned`);
    }
    if (
      sender.profile?.balance === null ||
      sender.profile?.balance - dto.reward < 0
    ) {
      throw new BadRequestException(`insufficient balance`);
    }

    // initialize
    const newBalance = sender.profile?.balance - dto.reward;

    try {
      await queryRunner.startTransaction();

      const ledger = new Ledger({
        credit: dto.reward,
        ledgerType: LedgerType.CREDIT_ESCROW,
        balance: newBalance,
        note: `요청.사례금 (user: #${dto.senderId})`,
        userId: dto.senderId,
      });
      await queryRunner.manager.save(ledger);

      const plea = await queryRunner.manager.save(
        this.pleaRepository.create(dto),
      );
      await queryRunner.commitTransaction();

      return plea;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === 'ER_DUP_ENTRY') {
        // plea already exists
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

  async getMyReceivedPleasFromThisUser(
    myId: number,
    userId: number,
  ): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .innerJoinAndSelect('plea.dot', 'dot')
      .where({
        senderId: userId,
        recipientId: myId,
      })
      .getMany();

    return items;
  }

  async getMySentPleasToThisUser(
    myId: number,
    userId: number,
  ): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .innerJoinAndSelect('plea.dot', 'dot')
      .where({
        senderId: myId,
        recipientId: userId,
      })
      .getMany();

    return items;
  }

  //--------------------------------------------------------------------------//

  async getMyReceivedPleas(myId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .where({
        recipientId: myId,
      })
      .groupBy('plea.senderId')
      .getMany();

    return items;
  }

  async getMySentPleas(myId: number): Promise<Plea[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.recipient', 'recipient')
      .where({
        senderId: myId,
      })
      .groupBy('plea.recipientId')
      .getMany();

    return items;
  }

  //--------------------------------------------------------------------------//
  // Update
  //--------------------------------------------------------------------------//

  async update(id: number, dto: UpdatePleaDto): Promise<Plea> {
    const plea = await this.pleaRepository.preload({ id, ...dto });
    if (!plea) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.pleaRepository.save(plea);
  }

  //--------------------------------------------------------------------------//
  // Delete
  //--------------------------------------------------------------------------//

  async delete(id: number): Promise<Plea> {
    const plea = await this.pleaRepository.findOneOrFail({ where: { id } });
    console.log(plea);
    return await this.pleaRepository.softRemove(plea);
  }

  async deletePleas(senderId: number, recipientId: number): Promise<void> {
    console.log('delete pleas');
    const pleas = await this.findByIds(senderId, recipientId);

    console.log(pleas);
    await Promise.all(
      pleas.map(async (v: Plea) => await this.pleaRepository.softDelete(v.id)),
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
