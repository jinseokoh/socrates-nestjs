import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { AuctionStatus } from 'src/common/enums';
import { Auction } from 'src/domain/auctions/auction.entity';
import { CreateAuctionDto } from 'src/domain/auctions/dto/create-auction.dto';
import { SyncAuctionUsersDto } from 'src/domain/auctions/dto/sync-auction-users.dto';
import { UpdateAuctionDto } from 'src/domain/auctions/dto/update-auction.dto';
import { User } from 'src/domain/users/user.entity';
import { groupBy } from 'src/helpers/group-by';
import { FindOneOptions, Repository, UpdateResult } from 'typeorm';
import { AuctionItems } from './types/auction-items.type';
@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private readonly repository: Repository<Auction>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateAuctionDto): Promise<Auction> {
    const now = moment();
    const start = moment(dto.startTime);
    const end = moment(dto.endTime);
    if (now.isAfter(end)) {
      throw new BadRequestException(`end time already passed`);
    }
    if (now.isAfter(start)) {
      dto.status = AuctionStatus.ONGOING;
    }
    if (!dto.closingTime) {
      dto.closingTime = dto.endTime;
    }
    const auction = this.repository.create(dto);
    return await this.repository.save(auction);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Auction>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'title', 'lastBidAmount'],
      searchableColumns: ['title', 'subtitle'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        startTime: [FilterOperator.GTE, FilterOperator.LTE],
        weeks: [FilterOperator.GTE, FilterOperator.LTE],
        status: [FilterOperator.EQ, FilterOperator.NOT],
      },
    });
  }

  async getHistory(year: number): Promise<any> {
    const min = { min: year * 100 };
    const max = { max: (year + 1) * 100 };
    const items = await this.repository
      .createQueryBuilder('auction')
      .where('weeks > :min', min)
      .andWhere('weeks < :max', max)
      .getMany();

    return groupBy(items, 'weeks');
  }

  async findByIds(ids: number[]): Promise<Auction[]> {
    return await this.repository.findByIds(ids);
  }

  async findById(id: number, relations: string[] = []): Promise<Auction> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<Auction> {
    return await this.repository.findOne(params);
  }

  async count(artworkId: number): Promise<number> {
    return await this.repository.count({
      where: {
        artworkId,
        // status: Not(Status.ENDED),
      },
    });
  }

  async update(id: number, dto: UpdateAuctionDto): Promise<Auction> {
    const auction = await this.repository.preload({ id, ...dto });
    if (!auction) {
      throw new NotFoundException(`auction #${id} not found`);
    }
    return await this.repository.save(auction);
  }

  async softRemove(id: number): Promise<Auction> {
    const auction = await this.findById(id);
    return await this.repository.softRemove(auction);
  }

  async remove(id: number): Promise<Auction> {
    const auction = await this.findById(id);
    return await this.repository.remove(auction);
  }

  //** extras

  async sync(id: number, dto: SyncAuctionUsersDto): Promise<Auction> {
    const auction = await this.findById(id);
    const auctionUsers = await this.repository
      .createQueryBuilder()
      .relation(Auction, 'users')
      .of(auction)
      .loadMany();
    await this.repository
      .createQueryBuilder()
      .relation(Auction, 'users')
      .of(auction)
      .remove(auctionUsers);

    const users = await this.usersRepository.findByIds(dto.ids);
    auction.users = users;
    return await this.repository.save(auction);
  }

  async attach(auctionId: number, userId: number): Promise<any> {
    return await this.repository.manager.query(
      'INSERT IGNORE INTO `auction_user_alarm` (auctionId, userId) VALUES (?, ?)',
      [auctionId, userId],
    );
  }

  async detach(auctionId: number, userId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `auction_user_alarm` WHERE auctionId = ? AND userId = ?',
      [auctionId, userId],
    );
  }

  async getUnpaidItems(): Promise<AuctionItems[]> {
    // 12시에 스케쥴러 동작: 3일 이상 지나지 않았고, 미결제 위너를 찾아냄
    return await this.repository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.order', 'order')
      .where('order.isPaid = false')
      .andWhere('auction.status = :status', { status: AuctionStatus.ENDED })
      .andWhere('auction.closingTime >= NOW() - INTERVAL 3 DAY')
      .select(['auction.*'])
      .execute();
  }

  async getPaidItemsOnThe8thDayAfterPayment(): Promise<AuctionItems[]> {
    // 12시에 스케쥴러 동작: 결제후 8일째 된 옥션아이템
    return await this.repository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.order', 'order')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.isPaid = true')
      .andWhere('payment.paidAt >= NOW() - INTERVAL 8 DAY')
      .andWhere('payment.paidAt < NOW() - INTERVAL 7 DAY')
      .select(['auction.*'])
      .execute();
  }

  async getAuctionItemsOf(status: AuctionStatus): Promise<AuctionItems[]> {
    return await this.repository.manager.query(
      'SELECT id, startTime, endTime, closingTime, lastBidderId FROM `auction` WHERE status = ?',
      [status],
    );
  }

  async setAuctionTo(
    auctionId: number,
    status: AuctionStatus,
  ): Promise<UpdateResult> {
    return await this.repository
      .createQueryBuilder()
      .update(Auction)
      .set({ status })
      .where('id = :id', { id: auctionId })
      .execute();
  }
}
