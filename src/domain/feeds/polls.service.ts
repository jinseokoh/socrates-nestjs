import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { LedgerType, QuestionType } from 'src/common/enums';
import { CreateDotDto } from 'src/domain/feeds/dto/create-poll.dto';
import { UpdateDotDto } from 'src/domain/feeds/dto/update-poll.dto';
import { Dot } from 'src/domain/feeds/entities/poll.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { ageToFactionId } from 'src/helpers/age-to-faction';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DotsService {
  private readonly logger = new Logger(DotsService.name);

  constructor(
    @InjectRepository(Dot)
    private readonly repository: Repository<Dot>,
    private dataSource: DataSource, // for transaction
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateDotDto): Promise<Dot> {
    try {
      const factionId = ageToFactionId(dto.age);

      const createDotDto = { ...dto };
      delete createDotDto.age; // age 는 poll 생성때 필요없음.

      const poll = await this.repository.save(
        this.repository.create(createDotDto),
      );

      await this.repository.manager.query(
        'INSERT IGNORE INTO `poll_faction` (pollId, factionId) VALUES (?, ?)',
        [poll.id, factionId],
      );

      return poll;
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Dot>> {
    const config: PaginateConfig<Dot> = {
      relations: ['user', 'factions'],
      sortableColumns: ['id', 'answerCount'],
      searchableColumns: ['slug'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        createdAt: [FilterOperator.LT, FilterOperator.GT],
        'factions.id': [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, this.repository, config);
  }

  // Dot 리스트
  async getActives(age = null): Promise<Array<Dot>> {
    if (!age) {
      return await this.repository.find({
        relations: ['user'],
        where: {
          isActive: true,
        },
      });
    }

    // return await this.repository
    //   .createQueryBuilder('poll')
    //   .leftJoinAndSelect('poll.user', 'user')
    //   .innerJoinAndSelect('poll.factions', 'faction')
    //   .where('faction.id = :factionId', { factionId: ageToFactionId(age) })
    //   .andWhere('poll.isActive = :isActive', { isActive: true })
    //   .getMany();
    return await this.repository.find({
      relations: ['user', 'factions'],
      where: {
        isActive: true,
        factions: {
          id: ageToFactionId(age),
        },
      },
    });
  }

  async getInactives(age = null): Promise<Array<Dot>> {
    if (!age) {
      return await this.repository.find({
        relations: ['user'],
        where: {
          isActive: false,
        },
      });
    }

    return await this.repository.find({
      relations: ['user', 'factions'],
      where: {
        isActive: false,
        factions: {
          id: ageToFactionId(age),
        },
      },
    });
  }

  // Dot 리스트
  async getActivesBySlug(slug: string, age = null): Promise<Array<Dot>> {
    if (!age) {
      return await this.repository.find({
        where: {
          slug: slug,
          isActive: true,
        },
      });
    }

    return await this.repository.find({
      relations: ['user', 'factions'],
      where: {
        slug: slug,
        isActive: true,
        factions: {
          id: ageToFactionId(age),
        },
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Dot> {
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
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // Dot 갱신
  async update(id: number, dto: UpdateDotDto): Promise<Dot> {
    const poll = await this.repository.preload({ id, ...dto });
    if (!poll) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(poll);
  }

  // Dot increment
  async thumbsUp(id: number): Promise<void> {
    try {
      const poll = await this.findById(id, ['user', 'user.profile']);
      await this.repository.increment({ id }, 'up', 1);
      const total = poll.up + poll.down;
      if (total >= 50) {
        if (poll.up < poll.down) {
          await this.repository.softDelete(id);
        }
        if (poll.up > poll.down) {
          await this.repository.manager.query(
            'UPDATE `poll` SET isActive = 1 WHERE id = ?',
            [id],
          );
          if (poll.isActive == false) {
            //? 작성자에게 2코인 제공 보너스 지급
            const newBalance = poll.user.profile?.balance + 2;
            const ledger = new Ledger({
              debit: 2,
              ledgerType: LedgerType.DEBIT_EVENT,
              balance: newBalance,
              note: `발견 정식질문 등록선물 (대상#${id})`,
              userId: poll.userId,
            });
            await this.repository.save(ledger);

            // notification with event listener ------------------------------------//
            const event = new UserNotificationEvent();
            event.name = 'eventNotification';
            event.userId = poll.userId;
            event.token = poll.user.pushToken;
            event.options = poll.user.profile?.options ?? {};
            event.body = `제공한 질문이 정식 등록되어 2코인 선물을 보내 드립니다.`;
            event.data = {
              page: `settings/coin`,
              args: '',
            };
            this.eventEmitter.emit('user.notified', event);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Dot decrement
  async thumbsDown(id: number): Promise<void> {
    await this.repository.increment({ id }, 'down', 1);
  }
}
