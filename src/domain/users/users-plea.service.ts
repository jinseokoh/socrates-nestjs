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

  //! 요청 생성 (using transaction)
  //! profile's balance will be adjusted w/ ledger model event subscriber.
  //! - for hated(blocked) users, client needs to take care of 'em. (instead of server.)
  async createPlea(dto: CreatePleaDto): Promise<Plea> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOne(Friendship, {
        where: [
          { senderId: dto.senderId, recipientId: dto.recipientId },
          { senderId: dto.recipientId, recipientId: dto.senderId },
        ],
      });
      if (friendship) {
        if (friendship.status === FriendshipStatus.ACCEPTED) {
          throw new UnprocessableEntityException(`in a relationship`);
        } else {
          // friendship already exists
          throw new UnprocessableEntityException(`entity exists`);
        }
      }

      // validation ----------------------------------------------------------//
      const sender = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.senderId },
        relations: [`profile`],
      });
      if (sender?.isBanned) {
        throw new UnprocessableEntityException(`a banned user`);
      }
      if (
        sender.profile?.balance === null ||
        sender.profile?.balance - dto.reward < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }

      // initialize
      const newBalance = sender.profile?.balance - dto.reward;

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
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // plea already exists
        throw new UnprocessableEntityException(`entity exists`);
      } else if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException();
      } else {
        await queryRunner.rollbackTransaction();
      }
      throw error;
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

  // API 호출 시나리오
  // case 1) 요청받은 사용자가 [받은요청] > [프로필 > 발견] > [답변작성] 에서 완료시
  //         status 가 init 에서 pending 으로 전환
  // case 2) 친구신청 받은 사용자가 [받은친구신청] 에서 친구 수락시
  //         status 가 pending 에서 accepted 로 전환
  //
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

  //! 요청 삭제 (using transaction)
  // API 호출 시나리오
  // case 1) 요청받은 사용자가 요청 init 상태에서, 답글작성 거절
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  // case 2) 다른 경우 환불 처리 필요없음.
  //
  async delete(id: number): Promise<Plea> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation checks
      const plea = await queryRunner.manager.findOneOrFail(Plea, {
        where: {
          id: id,
        },
        relations: ['sender', 'sender.profile'],
      });

      if (plea.status === PleaStatus.INIT) {
        // plea.reward - 1 환불
        const newBalance = plea.sender.profile?.balance + plea.reward - 1;
        const ledger = new Ledger({
          debit: plea.reward - 1,
          ledgerType: LedgerType.DEBIT_REFUND,
          balance: newBalance,
          note: `요청 사례금 환불 (user: #${plea.sender.id}, plea: #${plea.id})`,
          userId: plea.sender.id,
        });
        await queryRunner.manager.save(ledger);
      }

      // soft-delete plea
      await queryRunner.manager.getRepository(Plea).softDelete(id);
      await queryRunner.commitTransaction();

      return plea;
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException();
      } else {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException(error.name ?? error.toString());
    } finally {
      await queryRunner.release();
    }
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
