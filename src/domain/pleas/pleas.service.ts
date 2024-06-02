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
import { CreatePleaDto } from 'src/domain/pleas/dto/create-plea.dto';
import { UpdatePleaDto } from 'src/domain/pleas/dto/update-plea.dto';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { DataSource, Repository } from 'typeorm';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { FriendshipStatus, LedgerType, PleaStatus } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PleasService {
  private readonly logger = new Logger(PleasService.name);

  constructor(
    @InjectRepository(Plea)
    private readonly repository: Repository<Plea>,
    private dataSource: DataSource, // for transaction
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  //! 요청 생성 (using transaction)
  //! profile's balance will be adjusted w/ ledger model event subscriber.
  //! - for hated(blocked) users, client needs to take care of 'em. (instead of server.)
  async create(dto: CreatePleaDto): Promise<Plea> {
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

      // validation ----------------------------------------------------------//
      const recipient = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.recipientId },
        relations: [`profile`],
      });

      // initialize
      const newBalance = sender.profile?.balance - dto.reward;
      const ledger = new Ledger({
        credit: dto.reward,
        ledgerType: LedgerType.CREDIT_ESCROW,
        balance: newBalance,
        note: `요청 사례금 (상대 #${dto.recipientId})`,
        userId: dto.senderId,
      });
      await queryRunner.manager.save(ledger);

      const pleaRepository = queryRunner.manager.getRepository(Plea);
      const plea = await queryRunner.manager.save(pleaRepository.create(dto));
      await queryRunner.commitTransaction();

      //? notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'friendRequestPlea';
      event.userId = recipient.id;
      event.token = recipient.pushToken;
      event.options = recipient.profile?.options ?? {};
      event.body = `${sender.username}님이 나에게 발견글 작성 요청을 보냈습니다. ${dto.message}`;
      event.data = {
        page: `connections`,
        tab: null,
      };
      this.eventEmitter.emit('user.notified', event);

      return plea;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        // plea already exists
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // OTP 비밀번호 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<Plea>> {
    const config: PaginateConfig<Plea> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        key: [FilterOperator.IN, FilterOperator.EQ],
      },
    };

    return await paginate(query, this.repository, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Plea> {
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

  // API 호출 시나리오
  // case 1) 요청받은 사용자가 [받은요청] > [프로필 > 발견] > [답변작성] 에서 완료시
  //         status 가 init 에서 pending 으로 전환
  // case 2) 친구신청 받은 사용자가 [받은친구신청] 에서 친구 수락시
  //         status 가 pending 에서 accepted 로 전환
  //
  async update(id: number, dto: UpdatePleaDto): Promise<Plea> {
    const plea = await this.repository.preload({ id, ...dto });
    if (!plea) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(plea);
  }


  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  //! 요청 삭제 (using transaction)
  // API 호출 시나리오
  // case 1) 요청받은 사용자가 요청 init 상태에서, 답글작성 거절
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  // case 2) 다른 경우 환불 처리 필요없음.
  //
  async remove(id: number): Promise<Plea> {
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
          note: `요청거절 사례금 환불 (요청발송 #${plea.senderId}, 요청수신 #${plea.recipientId})`,
          userId: plea.sender.id,
        });
        await queryRunner.manager.save(ledger);
      }

      // soft-delete plea
      await queryRunner.manager.getRepository(Plea).softDelete(id);
      await queryRunner.commitTransaction();

      return plea;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
